import { makeChangeNullabilityPlugin, makeExtendSchemaPlugin, makeWrapResolversPlugin, gql, ExtensionDefinition } from 'graphile-utils';

import * as resolver from  './resolver';
import { ResolverWrapperRules } from '../../../types';

function removePrivateQueries(builder) {
  builder.hook('GraphQLObjectType:fields', (fields, _, { scope: { isRootQuery } }) => {
    if (!isRootQuery) { return fields; }
    delete fields.userByEmail;

    return fields;
  });
}

function removePrivateMutations(builder) {
  builder.hook('GraphQLObjectType:fields', (spec) => {
    delete spec.createUser;
    delete spec.deleteUser;
    delete spec.deleteUserById;
    delete spec.deleteUserByEmail;
    delete spec.updateUserByEmail;

    return spec;
  });
}

function removePrivateUserFields(builder) {
  builder.hook('GraphQLObjectType:fields', (fields, _, { GraphQLObjectType }) => {
    if (GraphQLObjectType.name === 'User') {
      delete fields.passwordHash;
      delete fields.passwordSalt;
      delete fields.verified;
      delete fields.verifyToken;
      delete fields.passwordResetToken;
      delete fields.sessionsByUserId;
    }

    return fields;
  });
  builder.hook('GraphQLInputObjectType:fields', (fields, _, { GraphQLInputObjectType }) => {
    if (GraphQLInputObjectType.name === 'UserPatch') {
      delete fields.email;
      delete fields.role;
      delete fields.passwordHash;
      delete fields.passwordSalt;
      delete fields.verified;
      delete fields.verifyToken;
      delete fields.passwordResetToken;
    }

    return fields;
  });
}

export default [
  removePrivateUserFields,
  removePrivateQueries,
  removePrivateMutations,
  makeChangeNullabilityPlugin({
    User: {
      email: true,
    },
  }),
  makeWrapResolversPlugin({
    User: {
      email: {
        requires: {
          siblingColumns: [{ column: 'id', alias: '$userId' }],
        },
        resolve: resolver.adminOrOwnerOnlyField,
      },
    },
  }),
  makeWrapResolversPlugin({
    Query: {
      allPeople: {
        resolve: resolver.adminOnlyQuery,
      },
    },
  } as unknown as ResolverWrapperRules),
  makeExtendSchemaPlugin(({ pgSql: sql }) => ({
    typeDefs: gql`
      type AuthPayload {
        sessionToken: String!
        user: User!
      }
      input RegistrationInput {
        email: String!
        password: String!
        verifyPassword: String!
      }
      input FinishForgotPasswordInput {
        userId: String!
        password: String!
        verifyPassword: String!
        token: String!
      }
      input FinishForgotPasswordWithEmailInput {
        email: String!
        password: String!
        verifyPassword: String!
        token: String!
      }
      input UpdatePasswordInput {
        oldPassword: String!
        password: String!
        verifyPassword: String!
      }
      input LoginInput {
        email: String!
        password: String!
      }
      type UpdatePasswordPayload {
        success: Boolean!
      }
      type UpdateEmailPayload {
        success: Boolean!
      }
      type ForgotPasswordPayload {
        success: Boolean!
      }
      type CurrentUserPayload {
        user: User
      }
      extend type Query {
        currentUser: CurrentUserPayload!
      }
      extend type Mutation {
        login(input: LoginInput!): AuthPayload!
        register(input: RegistrationInput!): AuthPayload!
        forgotPassword (email: String!): ForgotPasswordPayload!
        finishForgotPassword (input: FinishForgotPasswordInput!): AuthPayload!
        finishForgotPasswordWithEmail (input: FinishForgotPasswordWithEmailInput!): AuthPayload!
        updatePassword(input: UpdatePasswordInput!): UpdatePasswordPayload!
        updateEmail(newEmail: String!): UpdateEmailPayload!
      }
    `,
    resolvers: {
      AuthPayload: {
        async user(...args) {
          return resolver.getUser(sql, ...args);
        },
      },
      CurrentUserPayload: {
        async user(...args) {
          return resolver.getUser(sql, ...args);
        },
      },
      Query: {
        currentUser: resolver.currentUser,
      },
      Mutation: {
        login: resolver.login,
        register: resolver.register,
        forgotPassword: resolver.forgotPassword,
        finishForgotPassword: resolver.finishForgotPassword,
        finishForgotPasswordWithEmail: resolver.finishForgotPasswordWithEmail,
        updatePassword: {
          resolve: resolver.updatePassword,
        },
        updateEmail: {
          resolve: resolver.updateEmail,
        },
      },
    },
  } as ExtensionDefinition)),
];
