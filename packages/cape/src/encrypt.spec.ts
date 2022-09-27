import { encrypt, rsaEncrypt, suite, aesEncrypt } from './encrypt';
import { TextDecoder, TextEncoder } from 'util';
import type { XCryptoKey } from 'hpke-js/types/src/xCryptoKey';
import { generateKeyPairSync, constants, privateDecrypt } from 'crypto';
import * as forge from 'node-forge';

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

    const key = encrypted.encapsulatedKey;
    console.log('key', key);
    const parsedIv = encrypted.cipherText.slice(0, 12);
    console.log('iv', parsedIv);
    // Manipuate the ciphertext to not include iv and tag.
    var forgeTag = forge.util.createBuffer(
      encrypted.cipherText.slice(encrypted.cipherText.length - 16, encrypted.cipherText.length),
    );
    var ciphertext = forge.util.createBuffer(encrypted.cipherText.slice(0, encrypted.cipherText.length - 16));
    const forgeKey = forge.util.binary.raw.encode(key);
    const forgeIv = forge.util.binary.raw.encode(parsedIv);
    const cipher = forge.cipher.createDecipher('AES-GCM', forgeKey);
    cipher.start({ iv: forgeIv, tag: forgeTag });
    cipher.update(ciphertext);
    cipher.finish();
    const decrypted = cipher.output;
    console.log('decrypted', decrypted);
  });

  test('rsa encrypt', async () => {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      // The standard secure default length for RSA keys is 2048 bits
      modulusLength: 2048,
    });

    const inputString = 'word arrays are terrible';
    const input = encoder.encode('word arrays are terrible');
    const key = publicKey.export({ type: 'spki', format: 'pem' });

    const keyBytes = encoder.encode(key.toString());
    // new Uint8Array(key);
    // encoded key is giberish.
    // console.log("encoded", decoder.decode(keyBytes))

    const encryptedBytes = await rsaEncrypt(input, keyBytes);

    const decryptedData = privateDecrypt(
      {
        key: privateKey,
        // In order to decrypt the data, we need to specify the
        // same hashing function and padding scheme that we used to
        // encrypt the data in the previous step
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(encryptedBytes),
    );

    expect(decryptedData.toString()).toBe(inputString);
  });
});
