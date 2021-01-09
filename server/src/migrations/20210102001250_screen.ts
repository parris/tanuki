import * as Knex from 'knex';

export const up = (db: Knex) : Promise<any[]> => (
  Promise.all([
    db.schema.createTable('screen', (table) => {
      table.bigIncrements('id');
      table.string('owner_id')
        .unsigned().references('id').inTable('user')
        .onDelete('cascade');
      table.string('name');
      table.boolean('archived').defaultTo(false);
      table.specificType('changes_since_last_publish', 'jsonb[]');
      table.jsonb('latest_document').defaultTo('{}');
      table.specificType('document_publish_history', 'jsonb[]');
      table.jsonb('unpublished_meta_changes').defaultTo('{}');
      table.timestamps(true, true);
    }),
  ])
);

export const down = (db: Knex) : Promise<any[]> => (
  Promise.all([
    db.schema.dropTableIfExists('screen'),
  ])
);
