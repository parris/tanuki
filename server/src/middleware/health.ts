import { Context } from "koa";

export default async (ctx: Context) => {
  ctx.response.type = 'application/json';
  ctx.body = { status: '200 OK' };
};
