import * as Koa from 'koa';
import * as requestLogger from 'koa-logger-winston';
import * as bodyParser from 'koa-bodyparser';
import cookie from 'koa-cookie';
import * as cors from 'kcors';
import postgraphile from 'postgraphile';
import { Logger } from 'winston';
import * as chalk from 'chalk'
import * as dotenv from 'dotenv';
import * as koaStatic from 'koa-static';
import * as koaMount from 'koa-mount';
import { graphqlUploadKoa } from 'graphql-upload';
import * as events from 'events';
import * as AWS from 'aws-sdk';

import logger from './utils/logger';
import handleErrors from './graphql/handleErrors';
import getGraphqlConfig from './graphql/config';
import { createPgPool } from './graphql/pgPool';
import { startSchemaWatcher } from './graphql/schemaWatcher';
import middleware from './middleware';

dotenv.config({ path: `${__dirname}/../.env-personal` });
dotenv.config({ path: `${__dirname}/../.env` });

events.EventEmitter.defaultMaxListeners = 100;
AWS.config.update({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

async function startApp() {
  const app = new Koa();

  app.use(requestLogger(logger as unknown as Logger));
  app.use(handleErrors);
  app.use(cors());
  app.use(bodyParser());
  app.use(graphqlUploadKoa());
  app.use(cookie());
  app.use(koaMount('/uploads', koaStatic(`${__dirname}/../uploads`, { gzip: true })));
  middleware({ app });

  const graphqlConfig = getGraphqlConfig();
  const pgPool = createPgPool(graphqlConfig);
  await startSchemaWatcher(pgPool, 'public', graphqlConfig);
  app.use(postgraphile(pgPool, 'public', graphqlConfig));

  await app.listen(process.env.PORT);
  logger.info(chalk.green(`Server started on: ${process.env.HOST || `http://localhost:${process.env.PORT}`}`));

  return app;
}

startApp();
