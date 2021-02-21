import { Context } from 'koa';
import { decrypt } from '../utils/security';

import { getAccessToken, connectService, serviceSettings } from '../utils/connectedAccountUtils';
import { sessionTokenToJWT } from '../utils/sessions';

const allowedServices = ['instagram', 'google', 'mailchimp'];

export default async (ctx: Context) => {
  if ((process.env.HOST ?? '').includes('localhost') && ctx.request.origin === 'http://127.0.0.1:3000') {
    ctx.redirect(`${process.env.HOST}${ctx.request.originalUrl}`);
    return;
  }

  const service = ctx.request.query && ctx.request.query.service;
  if (!service || !allowedServices.includes(service)) {
    throw new Error('Oauth - service not found');
  }
  const code = ctx.request.query && ctx.request.query.code;
  let nextURL = process.env.HOST ?? '';
  let sessionToken;
  let decodedJWT;

  try {
    nextURL = decrypt(ctx.request.query && ctx.request.query.state, process.env.APP_SECRET ?? '');
    sessionToken = ctx.cookies.get('sessionToken');
    const { jwtClaims } = await sessionTokenToJWT(sessionToken);
    decodedJWT = jwtClaims;
  } catch (e) {
    nextURL = process.env.HOST ?? '';
  }

  if (!decodedJWT || ctx.request.query.error) { ctx.redirect(nextURL); return; }

  let userData = await getAccessToken(service, code);
  if (serviceSettings[service].appendMeta) {
    userData = await serviceSettings[service].appendMeta(userData);
  }

  if (userData.error_message) { ctx.redirect(nextURL); return; }

  await connectService(service, decodedJWT.user_id, userData, sessionToken);

  ctx.redirect(nextURL);
};
