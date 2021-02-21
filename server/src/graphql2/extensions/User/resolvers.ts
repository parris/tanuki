// import { gql } from 'apollo-server';
// import { GraphQLResolveInfo } from 'graphql';
// import { Resolvers, TanukiUser } from '../../../generated/graphql';
// import { getOne } from '../../pgGQLUtils';
// import pg from "../../../utils/postgres";
// import { Extension } from '../../extension';
// import model from './model';

// const typeDefs = gql`
// type FakeScreen {
//   id: ID!
//   name: String!
//   ownerByOwnerId: TanukiUser
// }

// type FakeScreenPagination {
//   cursor: ID
//   nodes: [FakeScreen]
// }

// type TanukiUser {
//   id: ID!
//   name: String!
//   test: String
//   screens: FakeScreenPagination
// }

// input TanukiUserInput {
//   id: ID!
//   name: String!
// }

// extend type Mutation {
//   tanukiCreateOrUpdateUser(user: TanukiUserInput): TanukiUser
// }

// extend type Query {
//   tanukiUserById(id: ID!): TanukiUser
// }
// `;

// const resolvers: Resolvers = {
//   TanukiUser: {
//     test: (_root, _args, _context, _info: GraphQLResolveInfo) => {
//       return 'hello world';
//     }
//   },
//   Mutation: {
//     tanukiCreateOrUpdateUser: async (_root, args, _context, _info: GraphQLResolveInfo) => {
//       let user: { id: string, name: string } | null = null;

//       if (args.user?.id) {
//         user = await pg('user').where({ id: args.user.id }).first();
//       }

//       let dbId = user?.id ?? null;
//       const name: string = (args.user?.name || user?.name) ?? '';

//       if (dbId) {
//         await pg('user').where({ id: dbId }).update({ name });
//       } else {
//         dbId = (await pg.insert({
//           id: args.user?.id,
//           name,
//         }).into('user'));
//       }

//       return {
//         id: dbId ?? '',
//         name,
//       };
//     },
//   },
//   Query: {
//     tanukiUserById: getOne<TanukiUser>(model, 'id'),
//   },
// };

// export default {
//   typeDefs,
//   resolvers,
// } as Extension;
