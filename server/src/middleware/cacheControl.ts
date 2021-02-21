import { Context, Next } from "koa";

export default async (ctx: Context, next: Next) => {
  await next();

  if (ctx.request.method !== 'GET') {
    ctx.set('Cache-Control', 'no-cache');
  } else if (ctx.request.method === 'GET' && (ctx.response.is('html') || ctx.response.is('json'))) {
    // 10 second cache on html or json GETs
    ctx.set('Cache-Control', 'public, max-age=10, must-revalidate');

    if (typeof ctx.response.body === 'string') {
      const modifiedAt = ctx.response.body.match(/article:modified_time" content="([^"]*)"/);
      const canonicalURL = ctx.response.body.match(/rel="canonical" href="([^"]*)"/);
      if (modifiedAt && modifiedAt[1] && canonicalURL && canonicalURL[1]) {
        ctx.set('ETag', `W/"${canonicalURL[1]}-${modifiedAt[1]}"`);
      }
    }
  } else if (ctx.request.url.indexOf('sw.js') > -1) {
    // keep service worker uncached
    ctx.set('Cache-Control', 'max-age=0');
  } else if (ctx.request.method === 'GET') {
    // 2 hour cache on all static assets
    ctx.set('Cache-Control', 'max-age=7200');
  }
};
