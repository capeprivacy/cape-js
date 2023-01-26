import { webcrypto } from 'crypto';

export const getCrypto = () => {
  return webcrypto as Crypto;
};
