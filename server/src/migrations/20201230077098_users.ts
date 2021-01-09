import * as Knex from 'knex';

export const up = (db: Knex) : Promise<any[]> => (
  Promise.all([
    db.schema.createTable('user', (table) => {
      table.string('id').primary();
      table.string('name').defaultTo('');
      table.timestamps(true, true);
    }),
  ])
);

export const down = (db: Knex) : Promise<any[]> => (
  Promise.all([
    db.schema.dropTableIfExists('user'),
  ])
);
