import { GraphQLScalarType, ValueNode } from 'graphql';

import * as hashids from '../../../utils/hashids';

export const graphQLHashId: GraphQLScalarType = new GraphQLScalarType({
  name: 'Identifier',
  description: `The identifier for any object.`,
  serialize(value: any) {
    return hashids.encode(value.toString());
  },
  parseValue(value: any) {
    return hashids.decodeOne(value.toString());
  },
  parseLiteral(value: ValueNode) {
    switch (value.kind) {
      case 'StringValue':
        return hashids.decodeOne(value.value);
      default:
        throw `Cannot decode unmanaged literal ${value.kind}`;
    }
  }
});
