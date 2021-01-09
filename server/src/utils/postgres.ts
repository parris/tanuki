import * as knex from 'knex';

export default knex({
  client: 'pg',
  connection: process.env.PG_DATABASE_URL,
  searchPath: ['knex', 'public'],
  pool: { min: 2, max: parseInt(process.env.PG_POOL_SIZE || '', 10) || 10 }
});
