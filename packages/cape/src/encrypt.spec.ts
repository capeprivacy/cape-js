import { encrypt, suite, aesEncrypt, rsaEncrypt } from './encrypt';
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
    const { cipherText, plaintextDataKey } = await encrypt(encoder.encode(text), (keyPair.publicKey as XCryptoKey).key);
    const plainText = await suite.open({ recipientKey: keyPair, enc: plaintextDataKey }, cipherText);
    expect(decoder.decode(plainText)).toBe(text);
  });

  test('encrypt and decrypt using AES', async () => {
    const aesKey = forge.random.getBytesSync(32);

    const ciphertext = await aesEncrypt('my secret message', { plaintext: aesKey, ciphertext: '' });

    const parsedIv = ciphertext.slice(0, 12);
    const ciphertextBuffer = forge.util.createBuffer(ciphertext.slice(12, ciphertext.length - 16));
    const tagBuffer = forge.util.createBuffer(ciphertext.slice(ciphertext.length - 16, ciphertext.length));

    const cipher = forge.cipher.createDecipher('AES-GCM', aesKey);
    cipher.start({ iv: parsedIv, tag: tagBuffer });
    cipher.update(ciphertextBuffer);
    cipher.finish();
    const decrypted = cipher.output;

    expect(decrypted.toString()).toBe('my secret message');
  });

  test('encrypt and decrypt using AES with bytes', async () => {
    const msg = forge.random.getBytesSync(32);
    const aesKey = forge.random.getBytesSync(32);

    const ciphertext = await aesEncrypt(msg, { plaintext: aesKey, ciphertext: '' });

    const parsedIv = ciphertext.slice(0, 12);
    const ciphertextBuffer = forge.util.createBuffer(ciphertext.slice(12, ciphertext.length - 16));
    const tagBuffer = forge.util.createBuffer(ciphertext.slice(ciphertext.length - 16, ciphertext.length));

    const cipher = forge.cipher.createDecipher('AES-GCM', aesKey);
    cipher.start({ iv: parsedIv, tag: tagBuffer });
    cipher.update(ciphertextBuffer);
    cipher.finish();
    const decrypted = cipher.output;

    expect(decrypted.getBytes()).toBe(msg);
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

    const encryptedBytesForge = await rsaEncrypt(inputString, key.toString());

    const decryptedData = privateDecrypt(
      {
        key: privateKey,
        // In order to decrypt the data, we need to specify the
        // same hashing function and padding scheme that we used to
        // encrypt the data in the previous step
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(forge.util.binary.raw.decode(encryptedBytesForge)),
    );

    expect(decryptedData.toString()).toBe(inputString);
  });
});
