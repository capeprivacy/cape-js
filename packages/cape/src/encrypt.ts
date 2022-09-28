import { base64Decode } from './../../isomorphic/src/base64-decode-browser';
import { TextEncoder, TextDecoder } from 'util';
import { Aead, CipherSuite, Kdf, Kem } from 'hpke-js';
import { randomBytes, publicEncrypt, constants } from 'crypto';

import * as forge from 'node-forge';
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
  const key = new TextEncoder().encode('AES256Key-32Characters1234567890');
  const base64KeyString = Buffer.from(key).toString('base64');
  console.log('coded key', base64KeyString);
  // const stringKey = new TextDecoder().decode(key);
  // randomBytes(32);
  const cipher = forge.cipher.createCipher('AES-GCM', base64KeyString);

  // aesGCM uses 12 byte nonce.
  const iv = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const base64IvString = Buffer.from(iv).toString('base64');
  // const iv = randomBytes(12);
  cipher.start({ iv: base64IvString });
  cipher.update(forge.util.createBuffer(plainText));
  cipher.finish();
  const ciphertextByteArray = forge.util.binary.raw.decode(cipher.output.getBytes());
  const tagByteArray = forge.util.binary.raw.decode(cipher.mode.tag.getBytes());
  console.log('tagByteArray', tagByteArray);
  const ciphertext = new Uint8Array([...iv, ...ciphertextByteArray, ...tagByteArray]);
  return { cipherText: ciphertext, encapsulatedKey: new Uint8Array(key) };
}

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
  const cipherText = new Uint8Array(encrypted);
  return cipherText;
}
