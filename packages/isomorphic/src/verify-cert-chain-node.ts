import type { AttestationDocument } from '@capeprivacy/types';
import { Certificate, CertificateChainValidationEngine, CertificateChainValidationEngineVerifyResult } from 'pkijs';
import fetch from 'isomorphic-fetch';
import * as fflate from 'fflate';
import { TextDecoder } from 'util';

export const verifyCertChain = async (
  doc: AttestationDocument,
  rootCert: Buffer,
  checkDate?: Date,
): Promise<CertificateChainValidationEngineVerifyResult> => {
  if (checkDate == undefined) {
    checkDate = new Date(Date.now());
  }

  const root = Certificate.fromBER(rootCert);
  const cert = Certificate.fromBER(doc.certificate);

  const trustedCerts = [root];

  const certs = [cert];
  for (const cBytes of doc.cabundle) {
    certs.push(Certificate.fromBER(cBytes));
  }

  const certChainVerificationEngine = new CertificateChainValidationEngine({
    trustedCerts,
    certs: certs,
    checkDate: checkDate,
  });

  return await certChainVerificationEngine.verify();
};

export const getAWSRootCert = async (url: string): Promise<Buffer> => {
  const res = await fetch(url);
  if (res.status >= 400) {
    throw new Error('Bad response from server');
  }

  const buf = await res.arrayBuffer();

  const unzipped = fflate.unzipSync(new Uint8Array(buf), {});
  const f = unzipped['root.pem'];
  const pem = new TextDecoder().decode(f);

  let der = pem.replace('-----BEGIN CERTIFICATE-----', '');
  der = der.replace('-----END CERTIFICATE-----', '');

  return Buffer.from(der.trim(), 'base64');
};

export const getCertificateNotBefore = (certificate: Uint8Array): Date => {
  const cert = Certificate.fromBER(certificate);

  return cert.notBefore.value;
};
