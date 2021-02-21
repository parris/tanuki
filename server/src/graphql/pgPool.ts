import { Pool } from 'pg';
import { parse as parsePgConnectionString } from 'pg-connection-string';

let pool : Pool;

export const createPgPool = (graphqlConfig) : Pool => {
  let pgConnectionString = process.env.PG_DATABASE_URL || '';
  if (process.env.DATABASE_USE_SSL === 'true') {
    if (pgConnectionString.indexOf('?') > -1) {
      pgConnectionString += '&ssl=true';
    } else {
      pgConnectionString += '?ssl=true';
    }
  }

  if (pgConnectionString.includes('sslmode=verify-full')) {
    pgConnectionString += `&sslrootcert=${__dirname}/../../config/rds-ca-2019-root.pem`
  }

  pool = new Pool({
    ...parsePgConnectionString(pgConnectionString) as object,
    max: graphqlConfig.maxPoolSize || 10,
    idleTimeoutMillis: 500,
  });

  return pool;
};

export const getPgPool = () : Pool => pool;
