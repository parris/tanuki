import * as cookie from 'cookie';
import { Context, Next } from "koa";
import { sessionTokenToJWT } from '../utils/sessions';
import { createJWT } from '../utils/security';
import { UserRole } from '../types';

export default async (ctx: Context, next: Next) => {
  const parseCookie = cookie.parse(ctx.req.headers.cookie ?? '');
  let sessionToken: string = parseCookie.sessionToken ?? '';
  const authorizationHeader = ctx.req.headers.authorization ?? '';

  if (!sessionToken) {
    sessionToken = authorizationHeader.includes('bearer') ?
      authorizationHeader.split('bearer ')[1] :
      authorizationHeader.split('Bearer ')[1];
  }

  if (typeof sessionToken === 'string' && sessionToken.length > 0) {
    const { jwtToken } = await sessionTokenToJWT(sessionToken);

    if (typeof jwtToken === 'string' && jwtToken.length > 0) {
      ctx.req.headers.authorization = `bearer ${jwtToken}`;
    } else {
      ctx.response.type = 'application/json';
      ctx.body = { error: 'Token expired' };
      return;
    }
  } else {
    const anonJWT: string = createJWT(null, UserRole.tanuki_anonymous.toString());
    ctx.req.headers.authorization = `bearer ${anonJWT}`;
  }

  await next();
};
