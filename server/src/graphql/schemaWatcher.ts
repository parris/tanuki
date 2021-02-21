import { watchPostGraphileSchema, PostGraphileOptions } from 'postgraphile';
import { Pool } from 'pg';

let graphqlSchema;
export async function startSchemaWatcher(pgPool: Pool, schemaName: string, graphqlConfig: PostGraphileOptions) {
  await watchPostGraphileSchema(
    pgPool,
    schemaName,
    graphqlConfig,
    (newSchema) => {
      graphqlSchema = newSchema;
    },
  );
}

export function getSchema() {
  return graphqlSchema;
}
