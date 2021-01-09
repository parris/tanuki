import { IResolvers } from 'apollo-server';
import { DocumentNode } from 'graphql';

export interface Extension {
  typeDefs: DocumentNode,
  resolvers: IResolvers,
}
