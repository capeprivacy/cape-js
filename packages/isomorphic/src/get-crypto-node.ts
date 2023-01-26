import * as nodeCrypt from 'crypto';

export const getCrypto = (): Crypto => {
  return nodeCrypt.webcrypto;
};
