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
      insert into document values (1, '{ "body": { "root": ["a"], "nodes": { "a": { "parentId": null, "id": "a", "childIds": [] }, "b": { "parentId": null, "id": "b", "childIds": ["c"] }, "c": { "parentId": "b", "id": "c", "childIds": [] }} } }');
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

    describe('bodyInsertNode events', () => {
      it('protects against invalid parentIds', async function() {
        await expect(wrapCreateDocumentChange(
          () => {},
          null,
          { input: { documentChange: { documentId: 1, change: JSON.stringify({ eventType: 'bodyInsertNode', parentId: 1 }) }} },
          context,
          null,
        )).to.be.rejectedWith(/must have parentId/);
        await expect(wrapCreateDocumentChange(
          () => {},
          null,
          { input: { documentChange: { documentId: 1, change: JSON.stringify({ eventType: 'bodyInsertNode' }) }} },
          context,
          null,
        )).to.be.rejectedWith(/must have parentId/);
      });

      it('protects against mismatching parentIds in the noded', async function() {
        await expect(wrapCreateDocumentChange(
          () => {},
          null,
          { input: { documentChange: { documentId: 1, change: JSON.stringify({ eventType: 'bodyInsertNode', parentId: '1', node: { parentId: '2'} }) }} },
          context,
          null,
        )).to.be.rejectedWith(/must match/);
      });

      it('protects against invalid insert positions', async function() {
        await expect(wrapCreateDocumentChange(
          () => {},
          null,
          { input: { documentChange: { documentId: 1, change: JSON.stringify({ eventType: 'bodyInsertNode', parentId: 'a', node: { parentId: 'a' } }) }} },
          context,
          null,
        )).to.be.rejectedWith(/require a position/);
        await expect(wrapCreateDocumentChange(
          () => {},
          null,
          { input: { documentChange: { documentId: 1, change: JSON.stringify({ eventType: 'bodyInsertNode', parentId: 'a', position: '0', node: { parentId: 'a' } }) }} },
          context,
          null,
        )).to.be.rejectedWith(/require a position/);
      });

      it('protects against nodes not being included', async function() {
        await expect(wrapCreateDocumentChange(
          () => {},
          null,
          { input: { documentChange: { documentId: 1, change: JSON.stringify({ eventType: 'bodyInsertNode', parentId: 'a', position: 0 }) }} },
          context,
          null,
        )).to.be.rejectedWith(/must have a \"node\"/);
      });

      it('inserts a root node', async function() {
        await wrapCreateDocumentChange(
          () => {},
          null,
          { input: {
            documentChange: {
              documentId: 1,
              change: JSON.stringify({
                eventType: 'bodyInsertNode',
                parentId: null,
                position: 0,
                node: { parentId: null, testing: 1 },
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

      it('inserts a nested node', async function() {
        await wrapCreateDocumentChange(
          () => {},
          null,
          { input: {
            documentChange: {
              documentId: 1,
              change: JSON.stringify({
                eventType: 'bodyInsertNode',
                parentId: 'a',
                position: 0,
                node: { parentId: 'a', testing: 1 },
              }),
            }}
          },
          context,
          null,
        );
        const document = db.public.one(`select * from document where id = 1;`);
        const body = document.draft.body;
        const newNodeId = body.nodes.a.childIds[0];
        expect(body.root.length).to.equal(1);
        expect(body.nodes.a.childIds.length).to.equal(1);
        expect(body.nodes[newNodeId].testing).to.equal(1);
      });
    });
    describe('bodyMoveNode events', () => {
      it('protects against invalid newParentIds', async function() {
        await expect(wrapCreateDocumentChange(
          () => {},
          null,
          { input: { documentChange: { documentId: 1, change: JSON.stringify({ eventType: 'bodyMoveNode', newParentId: 1, nodeId: 'a' }) }} },
          context,
          null,
        )).to.be.rejectedWith(/must have newParentId/);
        await expect(wrapCreateDocumentChange(
          () => {},
          null,
          { input: { documentChange: { documentId: 1, change: JSON.stringify({ eventType: 'bodyMoveNode', nodeId: 'a' }) }} },
          context,
          null,
        )).to.be.rejectedWith(/must have newParentId/);
      });

      it('protects against invalid nodeIds', async function() {
        await expect(wrapCreateDocumentChange(
          () => {},
          null,
          { input: { documentChange: { documentId: 1, change: JSON.stringify({ eventType: 'bodyMoveNode', newParentId: 'a', nodeId: 1, position: 0 }) }} },
          context,
          null,
        )).to.be.rejectedWith(/must have nodeId/);
        await expect(wrapCreateDocumentChange(
          () => {},
          null,
          { input: { documentChange: { documentId: 1, change: JSON.stringify({ eventType: 'bodyMoveNode', newParentId: 'a', position: 0 }) }} },
          context,
          null,
        )).to.be.rejectedWith(/must have nodeId/);
      });

      it('protects against invalid insert positions', async function() {
        await expect(wrapCreateDocumentChange(
          () => {},
          null,
          { input: { documentChange: { documentId: 1, change: JSON.stringify({ eventType: 'bodyMoveNode', newParentId: 'a', nodeId: 'a' }) }} },
          context,
          null,
        )).to.be.rejectedWith(/requires a position/);
        await expect(wrapCreateDocumentChange(
          () => {},
          null,
          { input: { documentChange: { documentId: 1, change: JSON.stringify({ eventType: 'bodyMoveNode', newParentId: 'a', position: '0', nodeId: 'a' }) }} },
          context,
          null,
        )).to.be.rejectedWith(/requires a position/);
      });

      xit('can move a node to the root', async function() {
        await wrapCreateDocumentChange(
          () => {},
          null,
          { input: {
            documentChange: {
              documentId: 1,
              change: JSON.stringify({
                eventType: 'bodyMoveNode',
                newParentId: null,
                position: 0,
                nodeId: 'c'
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
        expect(body.nodes.b.childIds).to.equal(0);
      });

      xit('supports jsonb array subtraction by value', () => {
        const db = newDb();
          pgMemHelpers(db);
          db.public.none(`
            create table page(
              id int,
              doc jsonb
            );
            insert into page values (1, '{ "hello": { "world": ["a", "b", "c"]} }');
          `);
          const example = db.public.one(`select (('{"a": ["b", "c"]}'::jsonb) -> 'a')::jsonb - 'b' as test`);
          expect(example.test.length).to.equal(1);
          expect(example.test[0]).to.be('c');

        const page1 = db.public.one(`
          select (doc->'hello'->'world' - 'a') as subset from public.page WHERE id = 1;
        `);
        expect(page1.subset.length).to.equal(2);

        db.public.one(`
          UPDATE public.page SET doc = jsonb_set(doc, '{hello, world}', doc->'hello'->'world' - 'a', true) WHERE id = 1;
        `);
        const page2 = db.public.one(`select * from page where id = 1;`);
        expect(page2.doc.hello.world.length).to.equal(2);
      });

      xit('can move a node to another node', async function() {
        await wrapCreateDocumentChange(
          () => {},
          null,
          { input: {
            documentChange: {
              documentId: 1,
              change: JSON.stringify({
                eventType: 'bodyMoveNode',
                newParentId: 'a',
                position: 0,
                nodeId: 'c'
              }),
            }}
          },
          context,
          null,
        );
        const document = db.public.one(`select * from document where id = 1;`);
        const body = document.draft.body;
        const newNodeId = body.nodes.a.childIds[0];
        expect(body.root.length).to.equal(1);
        expect(body.nodes.a.childIds.length).to.equal(1);
        expect(body.nodes[newNodeId].testing).to.equal(1);
      });
    });

    describe('bodyPatchNode events', () => {
      it('protects against invalid nodeIds', async function() {
        await expect(wrapCreateDocumentChange(
          () => {},
          null,
          { input: { documentChange: { documentId: 1, change: JSON.stringify({ eventType: 'bodyPatchNode', nodeId: 1 }) }} },
          context,
          null,
        )).to.be.rejectedWith(/must have nodeId/);
        await expect(wrapCreateDocumentChange(
          () => {},
          null,
          { input: { documentChange: { documentId: 1, change: JSON.stringify({ eventType: 'bodyPatchNode' }) }} },
          context,
          null,
        )).to.be.rejectedWith(/must have nodeId/);
      });

      it('protects against invalid nodes', async function() {
        await expect(wrapCreateDocumentChange(
          () => {},
          null,
          { input: { documentChange: { documentId: 1, change: JSON.stringify({ eventType: 'bodyPatchNode', nodeId: 'a', node: null }) }} },
          context,
          null,
        )).to.be.rejectedWith(/must have a \"node\"/);
        await expect(wrapCreateDocumentChange(
          () => {},
          null,
          { input: { documentChange: { documentId: 1, change: JSON.stringify({ eventType: 'bodyPatchNode', nodeId: 'a', node: 1 }) }} },
          context,
          null,
        )).to.be.rejectedWith(/must have a \"node\"/);
      });

      xit('patchs a node', async function() {
        await wrapCreateDocumentChange(
          () => {},
          null,
          { input: {
            documentChange: {
              documentId: 1,
              change: JSON.stringify({
                eventType: 'bodyPatchNode',
                nodeId: 'c',
                node: { hello: 'world'},
              }),
            }}
          },
          context,
          null,
        );
        const document = db.public.one(`select * from document where id = 1;`);
        const body = document.draft.body;
        expect(body.nodes.c.hello).to.equal('world');
      });
    });
  });
});
