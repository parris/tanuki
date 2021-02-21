import Hashids from 'hashids/dist/hashids';

const startingSessionTokenSize = 6;
const tokenAlphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';

export const userPublicToPrivateId = (publicId: string): number => {
  const sessionHashId = new Hashids(process.env.GENERIC_HASHID_SALT ?? '', startingSessionTokenSize, tokenAlphabet);
  return sessionHashId.decode(publicId)[0] as number;
}
export const userPrivateToPublicId = (privateId: bigint): string => {
  const sessionHashId = new Hashids(process.env.GENERIC_HASHID_SALT ?? '', startingSessionTokenSize, tokenAlphabet);
  return sessionHashId.encode(privateId);
}
