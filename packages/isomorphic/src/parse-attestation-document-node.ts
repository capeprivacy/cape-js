import 'cbor-rn-prereqs'; // Fixes TextDecoder not found issue and must be imported before cbor
import { decodeAllSync } from 'cbor';
import type { AttestationDocument } from '@capeprivacy/types';
import { pki, asn1, util } from 'node-forge';
import { Certificate } from 'pkijs';
import { ec } from 'elliptic';
import { base64Decode } from './base64-decode-node';
import { webcrypto } from 'crypto';
import { setEngine, CryptoEngine } from 'pkijs';

/**
 * Parses an attestation document and returns the decoded payload.
 *
 * @param document The attestation document base64 encoded.
 * @returns The attestation document.
 */
export const parseAttestationDocument = (document: string): AttestationDocument => {
  const payloadArray = decodeAllSync(document, {
    preferWeb: true, // Uses Uint8Array over Buffer needed for Tink
    encoding: 'base64',
  })[0];
  if (!Array.isArray(payloadArray) || payloadArray.length !== 4) {
    throw new Error('Invalid attestation document');
  }
  return decodeAllSync(payloadArray[2], {
    preferWeb: true,
  })[0];
};

export const verifySignature = async (publicKey: string): Promise<boolean> => {
  var pem =
    '-----BEGIN CERTIFICATE-----\nMIICezCCAgGgAwIBAgIQAYH+dIT3SiQAAAAAYtCAjzAKBggqhkjOPQQDAzCBjjEL\nMAkGA1UEBhMCVVMxEzARBgNVBAgMCldhc2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0\nbGUxDzANBgNVBAoMBkFtYXpvbjEMMAoGA1UECwwDQVdTMTkwNwYDVQQDDDBpLTAy\nOWUwZWFjYjY1MjY3Y2FhLnVzLWVhc3QtMi5hd3Mubml0cm8tZW5jbGF2ZXMwHhcN\nMjIwNzE0MjA0NjA0WhcNMjIwNzE0MjM0NjA3WjCBkzELMAkGA1UEBhMCVVMxEzAR\nBgNVBAgMCldhc2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxDzANBgNVBAoMBkFt\nYXpvbjEMMAoGA1UECwwDQVdTMT4wPAYDVQQDDDVpLTAyOWUwZWFjYjY1MjY3Y2Fh\nLWVuYzAxODFmZTc0ODRmNzRhMjQudXMtZWFzdC0yLmF3czB2MBAGByqGSM49AgEG\nBSuBBAAiA2IABAV56iqfGfjdMyXc5cKI47J9gIdxkkJyjRATnKfVSx+4RYO53Sqa\nb6BeljMJnI5DdC+gubDLqoIzFCSqxZWQ55FeDytA2PP3YaOH/KEOSoCe1Yi5sHWd\nAmBCuBPvGPZTJ6MdMBswDAYDVR0TAQH/BAIwADALBgNVHQ8EBAMCBsAwCgYIKoZI\nzj0EAwMDaAAwZQIwEQ+tuK1NHDAlS3rtWC0kieUZoZTOMaEdD7v2lQnp+zgJu6mU\n904Cx0QaI+kKzy0bAjEAne90J4+NEngbmOi8Sj9ebA+eKQ45/ntoSzdT9ArQuVXq\n9PETUpqM4vP+K6Rcp4BW\n-----END CERTIFICATE-----\n';
  var der =
    'MIICezCCAgGgAwIBAgIQAYH+dIT3SiQAAAAAYtCAjzAKBggqhkjOPQQDAzCBjjELMAkGA1UEBhMCVVMxEzARBgNVBAgMCldhc2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxDzANBgNVBAoMBkFtYXpvbjEMMAoGA1UECwwDQVdTMTkwNwYDVQQDDDBpLTAyOWUwZWFjYjY1MjY3Y2FhLnVzLWVhc3QtMi5hd3Mubml0cm8tZW5jbGF2ZXMwHhcNMjIwNzE0MjA0NjA0WhcNMjIwNzE0MjM0NjA3WjCBkzELMAkGA1UEBhMCVVMxEzARBgNVBAgMCldhc2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxDzANBgNVBAoMBkFtYXpvbjEMMAoGA1UECwwDQVdTMT4wPAYDVQQDDDVpLTAyOWUwZWFjYjY1MjY3Y2FhLWVuYzAxODFmZTc0ODRmNzRhMjQudXMtZWFzdC0yLmF3czB2MBAGByqGSM49AgEGBSuBBAAiA2IABAV56iqfGfjdMyXc5cKI47J9gIdxkkJyjRATnKfVSx+4RYO53Sqab6BeljMJnI5DdC+gubDLqoIzFCSqxZWQ55FeDytA2PP3YaOH/KEOSoCe1Yi5sHWdAmBCuBPvGPZTJ6MdMBswDAYDVR0TAQH/BAIwADALBgNVHQ8EBAMCBsAwCgYIKoZIzj0EAwMDaAAwZQIwEQ+tuK1NHDAlS3rtWC0kieUZoZTOMaEdD7v2lQnp+zgJu6mU904Cx0QaI+kKzy0bAjEAne90J4+NEngbmOi8Sj9ebA+eKQ45/ntoSzdT9ArQuVXq9PETUpqM4vP+K6Rcp4BW';

  var derBuf = Buffer.from(der, 'base64');
  // var firstPub = keys.publicKey
  // var firstAsn1 = pki.publicKeyToAsn1(firstPub)
  // var derBuf = util.decode64(derb64)

  var cert = Certificate.fromBER(derBuf);
  var pub = await cert.getPublicKey();
  pub.console.log(pub);
  // var der = firstAsn1.type
  //var pub = pki.certificateFromPem(pem)

  //console.log(util.bytesToHex(der.bytes()))

  // var EC = new ec("p384");

  // var pair = EC.keyFromPublic(der.bytes(), 'der')

  // console.log(pair.getPublic().getX(), pair.getPublic().getY());

  return true;
};
