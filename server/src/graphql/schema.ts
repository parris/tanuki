import { gql, IResolvers } from 'apollo-server';
import * as GraphQlJSON from 'graphql-type-json';

import screen from './extensions/Screen/resolvers';
import user from './extensions/User/resolvers';
import { Extension } from './extension';
import * as deepmerge from 'deepmerge';

const extensions: Extension[] = [
  screen,
  user,
];

const rootTypeDefs = gql`
  scalar JSON

  type Subscription {
    _root: Boolean
  }
  type Mutation
  type Query
`;

const rootResolvers = {
  JSON: GraphQlJSON,
}

export default {
  typeDefs: [rootTypeDefs, ...extensions.map((r) => r.typeDefs)],
  resolvers: deepmerge.all([rootResolvers, ...extensions.map((r) => r.resolvers)]),
} as IResolvers;
