import * as KoaRouter from 'koa-router';

import handleError from './setupMonitoring';
import cacheControl from './cacheControl';
import sessions from './sessions';
import oauth from './oauth';
import health from './health';

export default async ({ app }) => {
  if (process.env.NODE_ENV === 'production') {
    app.on('error', handleError);
  }
  app.use(async (ctx, next) => {
    ctx.req.setTimeout(30000); // 30s, selected because this is heroku's timeout
    await next();
  });
  app.use(sessions);
  app.use(cacheControl);

  const router = new KoaRouter();

  router.get('/services/oauth-redirect', oauth);
  router.get('/health', health);

  app.use(router.routes());
};
