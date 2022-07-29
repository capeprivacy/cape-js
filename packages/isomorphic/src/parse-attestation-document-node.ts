import type { AttestationDocument } from '@capeprivacy/types';
import 'cbor-rn-prereqs'; // Fixes TextDecoder not found issue and must be imported before cbor
import { decodeAllSync } from 'cbor';

/**
 * Parses an attestation document and returns the decoded payload.
 *
 * @param document The attestation document base64 encoded.
 * @returns The attestation document.
 */
export const parseAttestationDocument = (document: string): AttestationDocument => {
  const payloadArray = decodeAllSync(document, {
    encoding: 'base64',
  })[0];
  if (!Array.isArray(payloadArray) || payloadArray.length !== 4) {
    throw new Error('Invalid attestation document');
  }
  return decodeAllSync(payloadArray[2], {
    preferWeb: true,
  })[0];
};
