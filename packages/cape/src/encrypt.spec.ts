import { encrypt, aesEncrypt, rsaEncrypt, suite } from './encrypt';
import { TextDecoder, TextEncoder } from 'util';
import type { XCryptoKey } from 'hpke-js/types/src/xCryptoKey';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

describe('encrypt', () => {
  test('encrypt and decrypt the text', async () => {
    const text = 'hello world';
    const keyPair = await suite.generateKeyPair();
    const { cipherText, encapsulatedKey } = await encrypt(encoder.encode(text), (keyPair.publicKey as XCryptoKey).key);
    const plainText = await suite.open({ recipientKey: keyPair, enc: encapsulatedKey }, cipherText);
    expect(decoder.decode(plainText)).toBe(text);
  });

  test('encrypt and decrypt using AES', async () => {
    const text = 'what is rsa';
    const encrypted = await aesEncrypt(encoder.encode(text));

    const key = decoder.decode(encrypted.encapsulatedKey);
    // We parse the byte array to string then use the Crypto library encoding to turn it to WordArray.
    const parsed_iv = CryptoJS.enc.Utf8.parse(decoder.decode(encrypted.cipherText.slice(0, 12)));

    const cipherText = decoder.decode(encrypted.cipherText.slice(12, encrypted.cipherText.length));

    const decrypted = CryptoJS.AES.decrypt(cipherText, key, { iv: parsed_iv });
    console.log('decrypted message', decrypted);
  });
});
