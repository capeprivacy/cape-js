import { verifySignature } from './parse-attestation-document-node';

import * as crypto from 'crypto';

beforeEach(() => {
  global.crypto = crypto.webcrypto;
});

describe('verify-sig.node', () => {
  it('should do a thing', async () => {
    const str = await verifySignature('dGVzdA==');
    expect(str).toBe('test');
  });
});
