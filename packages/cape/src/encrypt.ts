import { encode } from 'cbor';
import { TextEncoder, TextDecoder } from '@capeprivacy/isomorphic';
import { Aead, CipherSuite, Kdf, Kem } from 'hpke-js';
import { publicEncrypt, constants } from 'crypto';
import { debug } from 'loglevel';
import * as forge from 'node-forge';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

interface EncryptResponse {
  cipherText: Uint8Array;
  encapsulatedKey: Uint8Array;
}

// Exported for testing
export const suite = new CipherSuite({
  kem: Kem.DhkemX25519HkdfSha256,
  kdf: Kdf.HkdfSha256,
  aead: Aead.Chacha20Poly1305,
});

/**
 * Encrypts the given input using the provided public key.
 *
 * @param plainText The plain text input to encrypt.
 * @param publicKey The public key to use for encryption.
 */
export async function encrypt(plainText: Uint8Array, publicKey: Uint8Array): Promise<EncryptResponse> {
  // We must import the public key since it's coming from an attestation document.
  const rkp = await suite.importKey('raw', publicKey, true);
  // Encrypt the plain text using the public key
  const { ct, enc } = await suite.seal({ recipientPublicKey: rkp }, plainText);
  // Convert both the ct and enc from an ArrayBuffer to Uint8Array's.
  return { cipherText: new Uint8Array(ct), encapsulatedKey: new Uint8Array(enc) };
}

/**
 * Encrypts the given input using a generated public key.
 *
 * @note this function does not base64 encode the ciphertext and just returns a uint8Array.
 *
 * @param plainText The plain text input to encrypt.
 */
export async function aesEncrypt(plainText: Uint8Array): Promise<EncryptResponse> {
  // byteArrayToWordArray(plainText);
  // Generate a new key
  const key = 'AES256Key-32Characters1234567890';

  const cipher = forge.cipher.createCipher('AES-GCM', key);
  debug('Created AES encryption material.');

  // aesGCM uses 12 byte nonce.
  const iv = '012345678910';

  // forge.random.getBytesSync(12);
  cipher.start({ iv: iv });
  cipher.update(forge.util.createBuffer(plainText));
  cipher.finish();
  const ciphertextByteArray = forge.util.binary.raw.decode(cipher.output.getBytes());
  const tagByteArray = forge.util.binary.raw.decode(cipher.mode.tag.getBytes());
  const ivArray = forge.util.binary.raw.decode(iv);
  const keyArray = forge.util.binary.raw.decode(key);
  const ciphertext = new Uint8Array([...ivArray, ...ciphertextByteArray, ...tagByteArray]);
  debug('Completed AES encryption of input. Ciphertext length is: ', ciphertext.length);
  return { cipherText: ciphertext, encapsulatedKey: keyArray };
}

/**
 * Encrypts the given input using the provided public key.
 *
 * @param plainText The plain text input to encrypt.
 * @param key The provided public key
 */
export async function rsaEncrypt(plainText: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
  const keyBuffer = Buffer.from(key);
  const encrypted = publicEncrypt(
    {
      key: keyBuffer,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(plainText),
  );
  debug('Finished RSA encryption.');
  const cipherText = new Uint8Array(encrypted);
  return cipherText;
}

/**
 * Encrypts the given input using the provided public key.
 *
 * @param plainText The plain text input to encrypt.
 * @param key The provided public key
 */
export async function forgeRsaEncrypt(plainText: Uint8Array, key: string): Promise<Uint8Array> {
  return forge.util.binary.raw.decode(
    forge.pki.publicKeyFromPem(key).encrypt(decoder.decode(plainText), 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      label: '', // Force the label to be empty.
      mgf1: forge.md.sha256.create(),
    }),
  );
}

/**
 * Cape encrypt takes an input and outputs a string that can be decrypted in the enclave.
 *
 * @param plainText The plain text input to encrypt.
 */
export async function capeEncrypt(capeKey: string, plainText: string): Promise<string> {
  const plainTextBytes = encoder.encode(plainText);
  const { cipherText, encapsulatedKey } = await aesEncrypt(plainTextBytes);
  debug('CapeEncrypt encrypting AES key with public key: ', capeKey);
  debug('CapeEncrypt encapsulated key: ', encapsulatedKey);
  const keyCipherText = await forgeRsaEncrypt(encapsulatedKey, capeKey);

  debug('CapeEncrypt keyciphertext: ', keyCipherText);
  const fullCipherText = new Uint8Array([...keyCipherText, ...cipherText]);
  const fullCipherTextString = Buffer.from(fullCipherText).toString('base64');
  debug('CapeEncrypt finished, encrypted string: ', fullCipherTextString);
  return 'cape:' + fullCipherTextString;
}
