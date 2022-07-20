import { verifySignature } from './parse-attestation-document-node';
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
    const str = await verifySignature('dGVzdA==');
    expect(str).toBe(true);
  });
});
