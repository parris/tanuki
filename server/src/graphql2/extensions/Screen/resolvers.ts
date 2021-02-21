// import { gql } from 'apollo-server';
// import { pubsub } from "../../../utils/redis";
// import postgres from "../../../utils/postgres";
// import { Extension } from '../../extension';
// import { Resolvers, TanukiScreen } from '../../../generated/graphql';
// import { getOne, buildGetOneQuery } from '../../pgGQLUtils';
// import model from './model';

// const typeDefs = gql`
//   enum TanukiDocumentChangeType {
//     ADD_COMPONENT
//     MOVE_COMPONENT
//     EDIT_COMPONENT
//     REMOVE_COMPONENT
//   }

//   type TanukiDocumentChange {
//     userId: ID!
//     changeType: TanukiDocumentChangeType!
//     changeParams: JSON!
//     reverseChangeType: TanukiDocumentChangeType!
//     reverseChangeParams: JSON!
//   }

//   input TanukiDocumentChangeInput {
//     changeType: TanukiDocumentChangeType!
//     changeParams: JSON!
//     reverseChangeType: TanukiDocumentChangeType!
//     reverseChangeParams: JSON!
//   }

//   type TanukiDocumentPublishHistory {
//     nodes: [JSON]!
//     nextCursor: ID
//   }

//   type TanukiScreenUnpublishMetaChanges {
//     name: String
//   }

//   type TanukiScreen {
//     id: ID!
//     ownerId: ID!
//     name: String!
//     archived: Boolean!

//     changesSinceLastPublish: [TanukiDocumentChange!]!
//     latestDocument: JSON!
//     documentPublishHistory(cursor: ID): TanukiDocumentPublishHistory!

//     unpublishedMetaChanges: TanukiScreenUnpublishMetaChanges!
//   }

//   input TanukiScreenFilter {
//     cursor: ID,
//     archived: Boolean
//   }

//   input TanukiScreenPatchInput {
//     name: String
//     archived: Boolean
//   }

//   type TanukiScreensPayload {
//     nodes: [TanukiScreen]!
//     nextCursor: ID
//   }

//   extend type Subscription {
//     tanukiDocumentUpdate(screenId: ID!): TanukiDocumentChange!
//   }

//   extend type Mutation {
//     tanukiCreateScreen: TanukiScreen
//     tanukiEditScreenMeta(id: ID!, screenMeta: TanukiScreenPatchInput): TanukiScreen
//     tanukiUpdateDocument(screenId: ID!, diffs: [TanukiDocumentChangeInput!]!): TanukiScreen
//     tanukiScreenPublish(id: ID!): TanukiScreen
//   }

//   extend type Query {
//     screens(filter: TanukiScreenFilter): TanukiScreensPayload!
//     screenById(id: ID!): TanukiScreen
//   }
// `;

// const TANUKI_DOCUMENT_UPDATE = 'TANUKI_DOCUMENT_UPDATE';
// const resolvers: Resolvers = {
//   Subscription: {
//     tanukiDocumentUpdate: {
//       subscribe: (_, args) => pubsub.asyncIterator(`${TANUKI_DOCUMENT_UPDATE}.${args.screenId}.*`),
//     },
//   },
//   Query: {
//     screens: () => ({
//       nodes: [],
//       nextCursor: null,
//     }),
//     tanukiScreenById: getOne<TanukiScreen>(model, 'id'),
//   },
//   Mutation: {
//     tanukiCreateScreen: async (_root, args, _context, info) => {
//       const id = (await postgres.insert({}).into('screen'))[0];
//       return (await buildGetOneQuery(model, 'id', { ...args, id }, info)).data as TanukiScreen;
//     },
//     tanukiEditScreenMeta: async (_root, args, _context, info) => {
//       const screen = (await buildGetOneQuery(model, 'id', args, info)).data as TanukiScreen;
//       (await postgres.update({ unpublished_meta_changes: args.screenMeta }).where({ id: args.id }).into('screen'))[0];
//       pubsub.publish(`${TANUKI_DOCUMENT_UPDATE}.${args.id}.meta`, { meta: args.screenMeta});
//       return screen;
//     },
//     tanukiUpdateDocument: async (_root, args, _context) => {
//       pubsub.publish(`${TANUKI_DOCUMENT_UPDATE}.${args.screenId}.change`, { diffs: args.diffs });
//       return {} as TanukiScreen;
//     },
//     tanukiScreenPublish: async (_root, args, _context) => {
//       pubsub.publish(`${TANUKI_DOCUMENT_UPDATE}.${args.id}.publish`, {});
//       return {} as TanukiScreen;
//     },
//   },
// };

// export default {
//   typeDefs,
//   resolvers,
// } as Extension;
