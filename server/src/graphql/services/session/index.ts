import { Plugin, SchemaBuilder } from "postgraphile";

function removePrivateQueries(builder: SchemaBuilder) {
  builder.hook('GraphQLObjectType:fields', (fields, _, { scope: { isRootQuery } }) => {
    if (!isRootQuery) { return fields; }

    delete fields.allSessions;
    delete fields.session;
    delete fields.sessionById;

    return fields;
  });
}

function removePrivateMutations(builder: SchemaBuilder) {
  builder.hook('GraphQLObjectType:fields', (spec: any) => {
    delete spec.createSession;
    delete spec.deleteSession;
    delete spec.deleteSessionById;
    delete spec.updateSession;
    delete spec.updateSessionById;

    return spec;
  });
}

export default [
  removePrivateQueries,
  removePrivateMutations,
] as Plugin[];
