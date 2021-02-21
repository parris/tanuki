import { decodeJWT } from './security';
import { JWTToken } from '../types';

export const JWTToSql = (jwt: string) : string => {
  const decodedJWT : JWTToken = decodeJWT(jwt);
  // "true" means this only applies to the current transaction
  const sql = `select
    set_config('role', '${decodedJWT.role || 'tanuki_anonymous'}', true),
    set_config('jwt.claims.user_id', '${decodedJWT.user_id}', true);
  `;
  return sql;
};

export const anonJWTToSql = () : string => {
  // "true" means this only applies to the current transaction
  const sql = `select
    set_config('role', 'tanuki_anonymous', true),
    set_config('jwt.claims.user_id', '0', true);
  `;
  return sql;
};

export const adminJWTToSql = () : string => {
  // "true" means this only applies to the current transaction
  const sql = `select
    set_config('role', 'tanuki_admin', true),
    set_config('jwt.claims.user_id', '0', true);
  `;
  return sql;
};
