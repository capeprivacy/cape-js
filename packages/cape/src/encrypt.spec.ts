import { encrypt, aesEncrypt, rsaEncrypt, suite, wordArrayToByteArray, byteArrayToWordArray } from './encrypt';
import { TextDecoder, TextEncoder } from 'util';
import type { XCryptoKey } from 'hpke-js/types/src/xCryptoKey';
import CryptoJS from 'crypto-js';

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
    const text = 'my secrete message';
    const encrypted = await aesEncrypt(encoder.encode(text));
    console.log('encrypted', encrypted);

    const key = decoder.decode(encrypted.encapsulatedKey);
    // We parse the byte array to string then use the Crypto library encoding to turn it to WordArray.
    const parsed_iv = byteArrayToWordArray(encrypted.cipherText.slice(0, 12));
    console.log('parsedIV', parsed_iv.toString(CryptoJS.enc.Base64));
    const cipherText = byteArrayToWordArray(encrypted.cipherText.slice(12, encrypted.cipherText.length));
    const stringCipherText = cipherText.toString();

    const decrypted = CryptoJS.AES.decrypt(stringCipherText, key, { iv: parsed_iv });
    console.log('decrypted message', decrypted.toString(CryptoJS.enc.Utf8));
  });

  test('byte array to word array', async () => {
    const input = encoder.encode('word arrays are terrible');

    // Act

    const result1 = byteArrayToWordArray(input);
    const result2 = wordArrayToByteArray(result1, null);

    for (var i = 0; i != input.length; i++) {
      expect(input[i]).toBe(result2[i]);
    }
  });
});
