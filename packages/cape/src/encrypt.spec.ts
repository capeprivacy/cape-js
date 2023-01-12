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

  test('encrypt and decrypt using AES', async () => {
    const encrypted = await aesEncrypt('my secret message');
    const key = forge.util.binary.raw.encode(encrypted.encapsulatedKey);

    const ciphertext = forge.util.binary.raw.encode(encrypted.cipherText);

    const parsedIv = ciphertext.slice(0, 12);
    const ciphertextBuffer = forge.util.createBuffer(ciphertext.slice(12, encrypted.cipherText.length - 16));
    const tagBuffer = forge.util.createBuffer(
      ciphertext.slice(encrypted.cipherText.length - 16, encrypted.cipherText.length),
    );

    const cipher = forge.cipher.createDecipher('AES-GCM', key);
    cipher.start({ iv: parsedIv, tag: tagBuffer });
    cipher.update(ciphertextBuffer);
    cipher.finish();
    const decrypted = cipher.output;

    expect(decrypted.toString() == 'my secret message').toBe(true);
  });

  test('encrypt and decrypt using AES with bytes', async () => {
    const msg = forge.random.getBytesSync(32);

    const encrypted = await aesEncrypt(msg);
    const key = forge.util.binary.raw.encode(encrypted.encapsulatedKey);

    const ciphertext = forge.util.binary.raw.encode(encrypted.cipherText);

    const parsedIv = ciphertext.slice(0, 12);
    const ciphertextBuffer = forge.util.createBuffer(ciphertext.slice(12, encrypted.cipherText.length - 16));
    const tagBuffer = forge.util.createBuffer(
      ciphertext.slice(encrypted.cipherText.length - 16, encrypted.cipherText.length),
    );

    const cipher = forge.cipher.createDecipher('AES-GCM', key);
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

    const encrypted = await capeEncrypt(pubPem, input);
    const result = encrypted.includes('cape');
    expect(result).toBe(true);
  });
});
