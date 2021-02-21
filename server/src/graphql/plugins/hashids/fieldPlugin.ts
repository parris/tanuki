import { Plugin, SchemaBuilder } from 'graphile-build';

import { transformBigIntToHashId } from './transform';
import * as hashids from '../../../utils/hashids';

export const hashIdInputPlugin: Plugin = (builder: SchemaBuilder) => {
  builder.hook('GraphQLInputObjectType:fields:field', (field, build, context) =>
    transformBigIntToHashId(
      field,
      build,
      context,
      context.scope.fieldName,
      field.description
    )
  );
};

export const hashIdOutputPlugin: Plugin = (builder: SchemaBuilder) => {
  builder.hook('GraphQLObjectType:fields:field', (field, build, context) =>
    transformBigIntToHashId(
      field,
      build,
      context,
      context.scope.fieldName,
      field.description
    )
  );
};

const base64 = (str: string): string =>
  Buffer.from(String(str)).toString('base64');
const base64Decode = (str: string): string =>
  Buffer.from(String(str), 'base64').toString('utf8');

export const hashIdNodeIdPlugin: Plugin = (builder: SchemaBuilder) => {
  // @ts-ignore
  builder.hook('build', (build) => {
    build.getNodeIdForTypeAndIdentifiers = (type: any, ...identifiers: any): string => {
      return base64(
        JSON.stringify([build.getNodeAlias(type), hashids.encode(identifiers)])
      );
    };
    build.getTypeAndIdentifiersFromNodeId = (nodeId: any): any => {
      const [alias, identifier] = JSON.parse(base64Decode(nodeId));
      return {
        Type: build.getNodeType(alias),
        identifiers: hashids.decode(identifier)
      };
    };
    return build;
  });
};
