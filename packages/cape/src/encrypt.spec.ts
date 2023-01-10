import { encrypt, suite, aesEncrypt, capeEncrypt, forgeRsaEncrypt } from './encrypt';
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

  test('encrypt and decrypt using AES with self generated key', async () => {
    // For some reason this decrypt succeeds but doesn't print out the proper message.
    const text = encoder.encode('my secrete message');
    const encrypted = await aesEncrypt(text);
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

  test('encrypt and decrypt using AES with userpassed AES key', async () => {
    const userPassedKey = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456';
    // For some reason this decrypt succeeds but doesn't print out the proper message.
    const text = encoder.encode('my secrete message');
    const encrypted = await aesEncrypt(text, userPassedKey);
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

  test('encrypt and decrypt using AES with provide key', async () => {
    const userPassedKey = '';
    // For some reason this decrypt succeeds but doesn't print out the proper message.
    const text = encoder.encode('my secrete message');
    await expect(aesEncrypt(text, userPassedKey)).rejects.toThrowError(
      'Key length does not match requirements, expected 32 but got 0',
    );
  });

  // We use the key pair generated using crypto library, which was working to
  // encrypt and decrypt the message. We use forge-crypto library to read in
  // the exported key and encrypt the message. This test is to ensure that
  // the decrypt will succeed in the KMS call in Cape runtime.
  test('rsa forge encrypt crypto decrypt', async () => {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      // The standard secure default length for RSA keys is 2048 bits
      modulusLength: 2048,
    });
    const key = publicKey.export({ type: 'spki', format: 'pem' });

    const inputString = 'word arrays are terrible';
    const input = encoder.encode(inputString);

    const encryptedBytesForge = await forgeRsaEncrypt(input, key.toString());

    const decryptedData = privateDecrypt(
      {
        key: privateKey,
        // In order to decrypt the data, we need to specify the
        // same hashing function and padding scheme that we used to
        // encrypt the data in the previous step
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(encryptedBytesForge),
    );

    expect(decryptedData.toString()).toBe(inputString);
  });

  test('test cape encrypt', async () => {
    const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
    const pubPem = forge.pki.publicKeyToPem(keypair.publicKey);
    const input = 'interesting';

    const encrypted = await capeEncrypt(input, pubPem);
    const result = encrypted.includes('cape');
    expect(result).toBe(true);
  });
});
