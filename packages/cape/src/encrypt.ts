import { Aead, CipherSuite, Kdf, Kem } from 'hpke-js';
import { randomBytes, publicEncrypt } from 'crypto';
import { CryptoJS } from 'cryptojs';

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

export async function aesEncrypt(plainText: Uint8Array): Promise<EncryptResponse> {
  // Generate a new key
  const key = randomBytes(32);

  const encrypted = CryptoJS.AES.encrypt(plainText, key);
  return { cipherText: new Uint8Array(encrypted), encapsulatedKey: new Uint8Array(key) };
}

export async function rsaEncrypt(plainText: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
  const keyBuffer = Buffer.from(key);
  const buffer = Buffer.from(plainText);
  const encrypted = publicEncrypt(keyBuffer, buffer);
  const cipherText = new Uint8Array(encrypted);
  return cipherText;
}
