import { decodeAllSync } from 'cbor-web';
import type { AttestationDocument } from '@cape/types';

export const parseAttestationDocument = (document: string): AttestationDocument => {
  const payloadArray = decodeAllSync(window.atob(document))[0];
  if (!Array.isArray(payloadArray) || payloadArray.length !== 4) {
    throw new Error('Invalid isomorphic document');
  }
  return decodeAllSync(payloadArray[2])[0];
};
