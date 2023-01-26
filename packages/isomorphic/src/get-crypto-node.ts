import * as nodeCrypt from 'crypto';

export const getCrypto = (): nodeCrypt.webcrypto.Crypto => {
  return nodeCrypt.webcrypto;
};
