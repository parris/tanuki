import { Context, Next } from "koa";

export default async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    if (ctx.response.type === 'application/json') {
      ctx.body = { error: 'Internal Server Error' };
    } else {
      ctx.body = 'Internal Server Error';
    }
    ctx.app.emit('error', err, ctx);
  }
};
