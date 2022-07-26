import type { AttestationDocument } from '@capeprivacy/types';
import { Certificate, CertificateChainValidationEngine, CertificateChainValidationEngineVerifyResult } from 'pkijs';

export const verifyCertChain = async (
  doc: AttestationDocument,
  checkDate?: Date,
): Promise<CertificateChainValidationEngineVerifyResult> => {
  if (checkDate == undefined) {
    checkDate = new Date(Date.now());
  }

  const cert = Certificate.fromBER(doc.certificate);

  const trustedCerts = [];
  for (const cBytes of doc.cabundle) {
    trustedCerts.push(Certificate.fromBER(cBytes));
  }

  const certChainVerificationEngine = new CertificateChainValidationEngine({
    trustedCerts,
    certs: [cert],
    checkDate: checkDate,
  });

  return await certChainVerificationEngine.verify();
};
