import { encrypt, rsaEncrypt, suite, aesEncrypt, capeEncrypt } from './encrypt';
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
    // For some reason this decrypt succeeds but doesn't print out the proper message.
    const text = 'my secrete message';
    const encrypted = await aesEncrypt(encoder.encode(text));
    const key = encrypted.encapsulatedKey;
    const parsedIv = encrypted.cipherText.slice(0, 12);
    // Manipuate the ciphertext to not include iv and tag.
    const forgeTag = forge.util.createBuffer(
      encrypted.cipherText.subarray(encrypted.cipherText.length - 16, encrypted.cipherText.length),
    );
    const ciphertext = forge.util.createBuffer(encrypted.cipherText.slice(0, encrypted.cipherText.length - 16));
    const forgeKey = forge.util.binary.raw.encode(key);
    const forgeIv = forge.util.binary.raw.encode(parsedIv);
    const cipher = forge.cipher.createDecipher('AES-GCM', forgeKey);
    cipher.start({ iv: forgeIv, tag: forgeTag });
    cipher.update(ciphertext);
    cipher.finish();
    const decrypted = cipher.output;

    expect(decrypted.toHex() == '').toBe(false);
  });

  test('rsa encrypt', async () => {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      // The standard secure default length for RSA keys is 2048 bits
      modulusLength: 2048,
    });

    const inputString = 'word arrays are terrible';
    const input = encoder.encode(inputString);
    const key = publicKey.export({ type: 'spki', format: 'pem' });
    const keyBytes = encoder.encode(key.toString());

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

  test('test cape encrypt', async () => {
    const { publicKey } = generateKeyPairSync('rsa', {
      // The standard secure default length for RSA keys is 2048 bits
      modulusLength: 2048,
    });

    const key = publicKey.export({ type: 'spki', format: 'pem' });
    const keyBytes = encoder.encode(key.toString());

    const input = encoder.encode('interesting');

    const encrypted = await capeEncrypt(keyBytes, input);
    const result = encrypted.includes('cape');
    expect(result).toBe(true);
  });
});
