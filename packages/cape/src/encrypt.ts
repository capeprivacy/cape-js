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
export async function aesEncrypt(plainText: Uint8Array, key?: string): Promise<EncryptResponse> {
  var useKey: string;
  // Generate a new key if the key isn't provided.
  if (typeof key !== 'undefined') {
    // We got the key and want to just use it but need to check if
    // the length of the key matches what we want.
    if (key.length != 32) {
      throw new Error(`Key length does not match requirements, expected 32 but got ${key.length}`);
    }

    useKey = key;
  } else {
    useKey = forge.random.getBytesSync(32);
  }

  const cipher = forge.cipher.createCipher('AES-GCM', useKey);

  // aesGCM uses 12 byte nonce.
  const iv = forge.random.getBytesSync(12);

  cipher.start({ iv: iv });
  cipher.update(forge.util.createBuffer(plainText));
  cipher.finish();
  const ciphertextByteArray = forge.util.binary.raw.decode(cipher.output.getBytes());
  const tagByteArray = forge.util.binary.raw.decode(cipher.mode.tag.getBytes());
  const ivArray = forge.util.binary.raw.decode(iv);
  const keyArray = forge.util.binary.raw.decode(useKey);
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
export async function capeEncrypt(plainText: string, RSAKey: string, AESKey?: string): Promise<string> {
  const plainTextBytes = encoder.encode(plainText);
  const { cipherText, encapsulatedKey } = await aesEncrypt(plainTextBytes, AESKey);
  const keyCipherText = await forgeRsaEncrypt(encapsulatedKey, RSAKey);

  debug('CapeEncrypt keyciphertext: ', keyCipherText);
  const fullCipherText = new Uint8Array([...keyCipherText, ...cipherText]);
  const fullCipherTextString = Buffer.from(fullCipherText).toString('base64');
  return 'cape:' + fullCipherTextString;
}
