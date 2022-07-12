import { encrypt, suite } from './encrypt';
import { TextDecoder, TextEncoder } from 'util';
import type { XCryptoKey } from 'hpke-js/types/src/xCryptoKey';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

describe('encrypt', () => {
  test('encrypt and decrypt the text', async () => {
    const text = 'hello world';
    const rkp = await suite.generateKeyPair();
    const plainText = encoder.encode(text);
    const { cipherText, encapsulatedKey } = await encrypt(plainText, (rkp.publicKey as XCryptoKey).key);
    const pt = await suite.open({ recipientKey: rkp, enc: encapsulatedKey }, cipherText);
    expect(text).toBe(decoder.decode(pt));
  });
});
