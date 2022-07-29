import { readFileSync } from 'fs';
import { join } from 'path';
import { parseAttestationDocument } from './parse-attestation-document-node';
import { verifySignature } from './verify-signature';
import * as pkijs from 'pkijs';
import * as crypto from 'crypto';

beforeEach(() => {
  const name = 'nodeEngine';
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  pkijs.setEngine(name, new pkijs.CryptoEngine({ name, crypto: crypto.webcrypto }));
});

describe('verify-sig.node', () => {
  it('should do a thing', async () => {
    const file = readFileSync(join(__dirname, '../attestation.bin'));
    const docBuf = Buffer.from(file);
    const docB64 = docBuf.toString('base64');

    const doc = parseAttestationDocument(docB64);

    const str = await verifySignature(docBuf, doc.certificate);
    expect(str).toBe(true);
  });
});
