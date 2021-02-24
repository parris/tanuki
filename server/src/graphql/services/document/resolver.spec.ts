import { expect } from 'chai';
import { newDb } from 'pg-mem';

import { getAdminJWT } from '../../../utils/security';
import pgMemHelpers from '../../../utils/testing/pgMemHelpers';
import { wrapCreateDocumentChange } from './resolver';

describe('document resolver', () => {
  describe('create document change', () => {
    const db = newDb();
    const { Client } = db.adapters.createPg()
    pgMemHelpers(db);

    db.public.none(`
      create table document(
        id int,
        draft jsonb
      );
      insert into document values (1, '{ "body": { "root": ["a"], "nodes": { "a": { "id": "a", "childIds": [] }} } }');
    `);

    const backup = db.backup();
    const context = {
      pgClient: new Client(),
      jwtToken: getAdminJWT(),
    };

    afterEach(() => {
      backup.restore();
    });

    it('protects against invalid JSON', async function() {
      await expect(wrapCreateDocumentChange(
        () => {},
        null,
        { input: { documentChange: { documentId: 1, change: "{ ''' df...}" }} },
        context,
        null,
      )).to.be.rejectedWith('Change must be valid JSON');
    });

    it('protects against bad eventTypes', async function() {
      await expect(wrapCreateDocumentChange(
        () => {},
        null,
        { input: { documentChange: { documentId: 1, change: JSON.stringify({ eventType: 'testing' }) }} },
        context,
        null,
      )).to.be.rejectedWith(/change\.eventType must be one of/);
    });

    describe('bodyInsertComponent events', () => {
      it('protects against invalid parentIds', async function() {
        await expect(wrapCreateDocumentChange(
          () => {},
          null,
          { input: { documentChange: { documentId: 1, change: JSON.stringify({ eventType: 'bodyInsertComponent', parentId: 1 }) }} },
          context,
          null,
        )).to.be.rejectedWith(/must have parentId/);
        await expect(wrapCreateDocumentChange(
          () => {},
          null,
          { input: { documentChange: { documentId: 1, change: JSON.stringify({ eventType: 'bodyInsertComponent' }) }} },
          context,
          null,
        )).to.be.rejectedWith(/must have parentId/);
      });

      it('protects against invalid insert positions', async function() {
        await expect(wrapCreateDocumentChange(
          () => {},
          null,
          { input: { documentChange: { documentId: 1, change: JSON.stringify({ eventType: 'bodyInsertComponent', parentId: 'a' }) }} },
          context,
          null,
        )).to.be.rejectedWith(/requires a position/);
        await expect(wrapCreateDocumentChange(
          () => {},
          null,
          { input: { documentChange: { documentId: 1, change: JSON.stringify({ eventType: 'bodyInsertComponent', parentId: 'a', position: '0' }) }} },
          context,
          null,
        )).to.be.rejectedWith(/requires a position/);
      });

      it('inserts a root component', async function() {
        await wrapCreateDocumentChange(
          () => {},
          null,
          { input: {
            documentChange: {
              documentId: 1,
              change: JSON.stringify({
                eventType: 'bodyInsertComponent',
                parentId: null,
                position: 0,
                component: { testing: 1 },
              }),
            }}
          },
          context,
          null,
        );
        const document = db.public.one(`select * from document where id = 1;`);
        const body = document.draft.body;
        expect(body.root.length).to.equal(2);
        expect(body.nodes[body.root[0]].testing).to.equal(1);
      });

      it('inserts a nested component', async function() {
        await wrapCreateDocumentChange(
          () => {},
          null,
          { input: {
            documentChange: {
              documentId: 1,
              change: JSON.stringify({
                eventType: 'bodyInsertComponent',
                parentId: 'a',
                position: 0,
                component: { testing: 1 },
              }),
            }}
          },
          context,
          null,
        );
        const document = db.public.one(`select * from document where id = 1;`);
        const body = document.draft.body;
        const newComponentId = body.nodes.a.childIds[0];
        expect(body.root.length).to.equal(1);
        expect(body.nodes.a.childIds.length).to.equal(1);
        expect(body.nodes[newComponentId].testing).to.equal(1);
      });
    });
  });
});
