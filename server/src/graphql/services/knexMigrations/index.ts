import { Plugin, SchemaBuilder } from "postgraphile";

function removePrivateQueries(builder: SchemaBuilder) {
  builder.hook('GraphQLObjectType:fields', (fields, _, { scope: { isRootQuery } }) => {
    if (!isRootQuery) { return fields; }

    Object.keys(fields).forEach((key) => {
      if (key.toLowerCase().includes('knex')) {
        delete fields[key];
      }
    });

    return fields;
  });
}

function removePrivateMutations(builder: SchemaBuilder) {
  builder.hook('GraphQLObjectType:fields', (spec: any) => {
    Object.keys(spec).forEach((key) => {
      if (key.toLowerCase().includes('knex')) {
        delete spec[key];
      }
    });

    return spec;
  });
}

export default [
  removePrivateQueries,
  removePrivateMutations,
] as Plugin[];
