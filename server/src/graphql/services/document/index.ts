import { makeExtendSchemaPlugin, makeWrapResolversPlugin, gql, embed } from 'graphile-utils';

import * as resolver from  './resolver';
import * as hashids from '../../../utils/hashids';

const topicFromArgs = (args) => {
  return `graphql:documentUpdated:${hashids.decodeOne(args.documentId)}`;
};

export default [
  makeExtendSchemaPlugin(({ pgSql: sql }) => ({
    typeDefs: gql`
      enum DocumentUpdateEventOperation {
        INSERT
        UPDATE
        DELETE
      }
      type DocumentUpdateEvent {
        event: String
        subject: String
        operation: DocumentUpdateEventOperation
      }
      type DocumentUpdateSubscriptionPayload {
        document: Document
        event: DocumentUpdateEvent
      }
      extend type Subscription {
        documentUpdated(documentId: String!): DocumentUpdateSubscriptionPayload @pgSubscription(topic: ${embed(topicFromArgs)})
      }
    `,
    resolvers: {
      DocumentUpdateSubscriptionPayload: {
        async document(...args) {
          return resolver.documentChanged(sql, ...args);
        },
      },
      Subscription: {
        documentUpdated: (event) => ({ event }),
      },
    },
  })),
  makeWrapResolversPlugin({
    Mutation: {
      createDocumentChange: resolver.wrapCreateDocumentChange,
    },
  }),
];
