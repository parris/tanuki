import Hashids from 'hashids/dist/hashids';

const hashIdSalt = process.env.GENERIC_HASHID_SALT ?? '';
const hashIdLength = parseInt(process.env.GENERIC_HASHID_LENGTH ?? '6', 10);
const tokenAlphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
const hashids = new Hashids(hashIdSalt as string, hashIdLength as number, tokenAlphabet);

export const encode = (...value: number[]) => {
  return hashids.encode(...value);
};
export const decode = (value: string) => {
  return hashids.decode(value);
};
export const decodeOne = (value: string) => {
  return decode(value)[0];
};
