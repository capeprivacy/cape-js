import * as pkijs from 'pkijs';
import { parseAttestationDocument } from './parse-attestation-document-node';
import { getAWSRootCert, verifyCertChain } from './verify-cert-chain-node';

import * as crypto from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

beforeEach(() => {
  const name = 'nodeEngine';
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  pkijs.setEngine(name, new pkijs.CryptoEngine({ name, crypto: crypto.webcrypto }));
});

describe('verify-cert-chain.node', () => {
  it('should successfully verify cert chain', async () => {
    const file = readFileSync(join(__dirname, '../attestation.bin'));
    const docB64 = Buffer.from(file).toString('base64');

    const doc = parseAttestationDocument(docB64);

    const root = await getAWSRootCert('https://aws-nitro-enclaves.amazonaws.com/AWS_NitroEnclaves_Root-G1.zip');
    const verified = await verifyCertChain(doc, root, new Date('2022-07-14T21:46:04.000Z'));
    expect(verified.result).toBe(true);
  });
});
