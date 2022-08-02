import type { AttestationDocument } from '@capeprivacy/types';
import { Certificate, CertificateChainValidationEngine, CertificateChainValidationEngineVerifyResult } from 'pkijs';

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

export const getAWSRootCert = async (): Promise<Buffer> => {
  const pem = `-----BEGIN CERTIFICATE-----
MIICETCCAZagAwIBAgIRAPkxdWgbkK/hHUbMtOTn+FYwCgYIKoZIzj0EAwMwSTEL
MAkGA1UEBhMCVVMxDzANBgNVBAoMBkFtYXpvbjEMMAoGA1UECwwDQVdTMRswGQYD
VQQDDBJhd3Mubml0cm8tZW5jbGF2ZXMwHhcNMTkxMDI4MTMyODA1WhcNNDkxMDI4
MTQyODA1WjBJMQswCQYDVQQGEwJVUzEPMA0GA1UECgwGQW1hem9uMQwwCgYDVQQL
DANBV1MxGzAZBgNVBAMMEmF3cy5uaXRyby1lbmNsYXZlczB2MBAGByqGSM49AgEG
BSuBBAAiA2IABPwCVOumCMHzaHDimtqQvkY4MpJzbolL//Zy2YlES1BR5TSksfbb
48C8WBoyt7F2Bw7eEtaaP+ohG2bnUs990d0JX28TcPQXCEPZ3BABIeTPYwEoCWZE
h8l5YoQwTcU/9KNCMEAwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUkCW1DdkF
R+eWw5b6cp3PmanfS5YwDgYDVR0PAQH/BAQDAgGGMAoGCCqGSM49BAMDA2kAMGYC
MQCjfy+Rocm9Xue4YnwWmNJVA44fA0P5W2OpYow9OYCVRaEevL8uO1XYru5xtMPW
rfMCMQCi85sWBbJwKKXdS6BptQFuZbT73o/gBh1qUxl/nNr12UO8Yfwr6wPLb+6N
IwLz3/Y=
-----END CERTIFICATE-----`;

  let der = pem.replace('-----BEGIN CERTIFICATE-----', '');
  der = der.replace('-----END CERTIFICATE-----', '');

  return Buffer.from(der.trim(), 'base64');
};
