import 'cbor-rn-prereqs'; // Fixes TextDecoder not found issue and must be imported before cbor
import { decodeAllSync } from 'cbor';
import type { AttestationDocument } from '@cape/types';

/**
 * Parses an isomorphic document and returns the decoded payload.
 * @param document The isomorphic document to parse represented as a buffer-like object.
 */
export const parseAttestationDocument = (document: string): AttestationDocument => {
  const payloadArray = decodeAllSync(Buffer.from(document, 'base64'), {
    preferWeb: true, // Uses Uint8Array over Buffer needed for Tink
  })[0];
  if (!Array.isArray(payloadArray) || payloadArray.length !== 4) {
    throw new Error('Invalid isomorphic document');
  }
  return decodeAllSync(payloadArray[2], {
    preferWeb: true,
  })[0];
};
