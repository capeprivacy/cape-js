import { TextEncoder } from '@capeprivacy/isomorphic';
import { Aead, CipherSuite, Kdf, Kem } from 'hpke-js';
import { debug } from 'loglevel';
import * as forge from 'node-forge';

const encoder = new TextEncoder();

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
export async function aesEncrypt(
  plainText: forge.Bytes | ArrayBuffer | forge.util.ArrayBufferView | forge.util.ByteBuffer,
): Promise<EncryptResponse> {
  // Generate a new key
  const key = forge.random.getBytesSync(32);

  const cipher = forge.cipher.createCipher('AES-GCM', key);

  // aesGCM uses 12 byte nonce.
  const iv = forge.random.getBytesSync(12);

  cipher.start({ iv: iv });
  cipher.update(forge.util.createBuffer(plainText));
  cipher.finish();

  const ciphertext = iv + cipher.output.getBytes() + cipher.mode.tag.getBytes();

  debug('Completed AES encryption of input. Ciphertext length is: ', ciphertext.length);
  return { cipherText: forge.util.binary.raw.decode(ciphertext), encapsulatedKey: forge.util.binary.raw.decode(key) };
}

/**
 * Encrypts the given input using the provided public key.
 *
 * @param plainText The plain text input to encrypt.
 * @param key The provided public key
 */
export async function forgeRsaEncrypt(plainText: Uint8Array, key: string): Promise<Uint8Array> {
  return forge.util.binary.raw.decode(
    forge.pki.publicKeyFromPem(key).encrypt(forge.util.binary.raw.encode(plainText), 'RSA-OAEP', {
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
  const { cipherText, encapsulatedKey } = await aesEncrypt(plainText);
  const keyCipherText = await forgeRsaEncrypt(encapsulatedKey, capeKey);

  debug('CapeEncrypt keyciphertext: ', keyCipherText);
  const fullCipherText = new Uint8Array([...keyCipherText, ...cipherText]);
  const fullCipherTextString = Buffer.from(fullCipherText).toString('base64');
  return 'cape:' + fullCipherTextString;
}
