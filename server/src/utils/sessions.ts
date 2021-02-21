import Hashids from 'hashids/dist/hashids';
import { JWTToken, UserRole } from '../types';
import { getPgPool } from '../graphql/pgPool';
import { createJWT, decodeJWT } from './security';

const sessionHashSalt = `TanukiSession_${process.env.APP_SECRET}`;
const startingSessionTokenSize = 32;
const tokenAlphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';

export const sessionTokenToId = (token: string): number => {
  const sessionHashId = new Hashids(sessionHashSalt, startingSessionTokenSize, tokenAlphabet);
  return sessionHashId.decode(token)[0] as number;
}
export const sessionIdToToken = (id: bigint): string => {
  const sessionHashId = new Hashids(sessionHashSalt, startingSessionTokenSize, tokenAlphabet);
  return sessionHashId.encode(id);
}

export const sessionTokenToJWT = async (token: string): Promise<{ jwtToken: string; jwtClaims: JWTToken; jwtRole: string[]; pgRole: string; }> => {
  const encodedSessionId = token ?? '';
  let jwtToken = '' as string;
  let jwtClaims = {} as JWTToken;

  try {
    if (encodedSessionId) {
      const sessionId = sessionTokenToId(encodedSessionId);
      const pg = getPgPool();
      const sessionData = await pg.query('SELECT id, user_id, role FROM session WHERE id = $1', [sessionId]);
      if (sessionData.rows && sessionData.rows.length) {
        jwtToken = createJWT(sessionData.rows[0].user_id, sessionData.rows[0].role);
        jwtClaims = decodeJWT(jwtToken);
      }
    }
  } catch (e) {
    jwtClaims = {} as JWTToken;
  }

  return {
    jwtToken,
    jwtClaims,
    jwtRole: [jwtClaims.role],
    pgRole: jwtClaims.role,
  };
}

export const createSessionToken = async (userId: number, role: UserRole): Promise<string> => {
  const pg = getPgPool();
  const sessionData = await pg.query('INSERT INTO session (user_id, role) VALUES ($1, $2) RETURNING id;', [userId, role.toString()]);
  return sessionIdToToken(sessionData.rows[0].id);
}
