import { ApolloServer } from 'apollo-server';
import schema from './graphql/schema';
import createRequestId from './utils/createRequestId';
import logger from './utils/logger';

const loggingPlugin = {
  requestDidStart(requestContext) {
    const requestID = createRequestId();
    logger.info(requestContext.request.operationName, { requestID, query: requestContext.request.operationName === 'IntrospectionQuery' ? 'omitted' : requestContext.request.query });

    return {
      didEncounterErrors(requestContext) {
        logger.error(`${requestContext.request.operationName} (${requestContext.errors.length} errors)`, { requestID, query: requestContext.request.query, errors: requestContext.errors });
      },
    };
  },
};

const server = new ApolloServer({
  ...schema,
  plugins: [
    loggingPlugin,
  ],
});
server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  logger.info(`🚀  Server ready at ${url}`);
});
