import * as bcrypt from 'bcrypt';

export default function hashPassword(pw: string, salt: string): Promise<string> {
  return bcrypt.hash(pw, salt);
}
