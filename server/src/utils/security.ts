import * as getAttr from 'just-safe-get';
import * as crypto from 'crypto';
import * as jsonwebtoken from 'jsonwebtoken';
import { JWTToken } from '../types';

const algorithm = 'aes-256-ctr';
const IV_LENGTH = 16; // For AES, this is always 16

export function encrypt(text: string, secret: string = getAttr(process, 'env.APP_SECRET', '')): string {
  const iv = Buffer.from(crypto.randomBytes(IV_LENGTH));
  const cipher = crypto.createCipheriv(algorithm, secret, iv);
  let crypted = cipher.update(text, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return `${iv.toString('hex')}:${crypted}`;
}

export function decrypt(text: string, secret: string = getAttr(process, 'env.APP_SECRET', '')): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift() ?? '', 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, secret, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

export function createJWT(id: string | null, role: string): string {
  return jsonwebtoken.sign(
    { role, user_id: id !== null ? parseInt(id || '-1', 10) : id },
    process.env.APP_SECRET as string,
    {
      audience: 'postgraphile',
      issuer: 'postgraphile',
      expiresIn: '10 days',
    },
  );
}

export function getAdminJWT(): string {
  return jsonwebtoken.sign(
    JSON.parse(process.env.ADMIN_JWT as string) as string,
    process.env.APP_SECRET as string,
    {
      audience: 'postgraphile',
      issuer: 'postgraphile',
      expiresIn: '1 day',
    },
  );
}

export function decodeJWT(token: string): JWTToken {
  return jsonwebtoken.verify(token, process.env.APP_SECRET as string, {
    audience: ['postgraphile'],
  }) as JWTToken;
}

const defaultAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export default function createRandomString(length: number, alphabet: string = defaultAlphabet): string {
  let text = '';

  for (let i = 0; i < length; i += 1) {
    text += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return text;
}
