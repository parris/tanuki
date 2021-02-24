import { makePluginHook, PostGraphileOptions, Plugin } from 'postgraphile';
import OperationHooks from '@graphile/operation-hooks';
import PgPubsub from '@graphile/pg-pubsub';

import { hashIdPlugins } from './plugins/hashids';
import UploadFieldPlugin from './plugins/uploads/plugin';
import document from './services/document';
import user from './services/user';
import { resolveUpload } from './plugins/uploads';
import websocketSessions from '../middleware/websocketSessions';

const pluginHook = makePluginHook([OperationHooks, PgPubsub]);

const config = {
  graphqlRoute: '/graphql',
  watchPg: process.env.NODE_ENV !== 'production',
  enhanceGraphiql: true,
  graphiql: true,
  graphiqlRoute: '/admin/graphiql',
  pgDefaultRole: 'tanuki_anonymous',
  defaultRole: 'tanuki_anonymous',
  jwtSecret: process.env.APP_SECRET,
  jwtPgTypeIdentifier: 'public.jwt_token',
  dynamicJson: true,
  bodySizeLimit: '500kb',
  defaultPaginationCap: 50,
  subscriptions: true,
  enableCors: true,
  showErrorStack: process.env.NODE_ENV !== 'production',
  allowExplain: () => { return process.env.NODE_ENV !== 'production'; },
  async additionalGraphQLContextFromRequest(req) {
    // @ts-ignore
    const jwtToken = req.headers.authorization.split(' ')[1]; // guarentee jwtToken is always included in context
    return { jwtToken };
  },
  pluginHook,
  appendPlugins: ([] as Plugin[]).concat(
    UploadFieldPlugin,

    user,
    document,

    hashIdPlugins,
  ),
  websocketMiddlewares: [
    websocketSessions,
  ],
  graphileBuildOptions: {
    // For any field from the database that we want to have an upload, we *can* shim it here
    uploadFieldDefinitions: [
      {
        match: ({ table, column }) => {
          return table === 'user' && column === 'avatar_image';
        },
        resolve: resolveUpload('user_avatars', (upload, ...args) => {
          const id = args[1]?.jwtClaims?.user_id ?? null;
          if (!id) {
            throw 'Not logged in';
          }
          const dotParts = upload.filename.split('.');
          const timestamp = new Date().toISOString().replace(/\D/g, "");
          return `${id}_${timestamp}.${dotParts[dotParts.length - 1]}`;
        }),
      },
    ],
  },
} as PostGraphileOptions;

export default () : PostGraphileOptions => (config);
