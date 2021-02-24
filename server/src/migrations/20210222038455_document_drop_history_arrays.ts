import * as Knex from 'knex';

export const up = (db: Knex) : Promise<any[]> => (
  Promise.all([
    db.schema.table('document', (t) => {
      t.dropColumn('unpublished_changes');
      t.dropColumn('published_revisions');
    }),
  ])
);

export const down = (db: Knex) : Promise<any[]> => (
  Promise.all([
    db.schema.table('document', (t) => {
      t.specificType('unpublished_changes', 'jsonb[]');
      t.specificType('published_revisions', 'jsonb[]');
    }),
  ])
);
