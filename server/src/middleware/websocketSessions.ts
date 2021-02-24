import { sessionTokenToJWT } from '../utils/sessions';
import { createJWT } from '../utils/security';
import { UserRole } from '../types';

export default async (req, _res, next) => {
  const authorizationHeader = req.headers.authorization ?? '';

  // We've already upgraded to a JWT for the socket
  // I don't like that we're checking the length here to determine
  // if we've upgraded the header.
  if (req.headers.authorization.length > 100) {
    next();
    return;
  }

  const sessionToken = authorizationHeader.includes('bearer') ?
      authorizationHeader.split('bearer ')[1] :
      authorizationHeader.split('Bearer ')[1];

  if (typeof sessionToken === 'string' && sessionToken.length > 0) {
    const { jwtToken } = await sessionTokenToJWT(sessionToken);

    if (typeof jwtToken === 'string' && jwtToken.length > 0) {
      req.headers.authorization = `bearer ${jwtToken}`;
    } else {
      // account for pausing execution and throwing here
    }
  } else {
    const anonJWT: string = createJWT(null, UserRole.tanuki_anonymous.toString());
    req.headers.authorization = `bearer ${anonJWT}`;
  }

  next();
};
