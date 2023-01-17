import { Aead, CipherSuite, Kdf, Kem } from 'hpke-js';
import { debug } from 'loglevel';
import * as forge from 'node-forge';

export interface DataKey {
  plaintext: string;
  ciphertext: string;
}

interface EncryptResponse {
  cipherText: Uint8Array;
  plaintextDataKey: Uint8Array;
}

// Exported for testing
export const suite = new CipherSuite({
  kem: Kem.DhkemX25519HkdfSha256,
  kdf: Kdf.HkdfSha256,
  aead: Aead.Chacha20Poly1305,
});

type PlainText = forge.Bytes | ArrayBuffer | forge.util.ArrayBufferView | forge.util.ByteBuffer;

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
  return { cipherText: new Uint8Array(ct), plaintextDataKey: new Uint8Array(enc) };
}

/**
 * Encrypts the given input using a generated public key.
 *
 * @note this function does not base64 encode the ciphertext and just returns a uint8Array.
 *
 * @param plainText The plain text input to encrypt.
 */
export async function aesEncrypt(plainText: PlainText, dataKey: DataKey): Promise<string> {
  const cipher = forge.cipher.createCipher('AES-GCM', dataKey.plaintext);

  // aesGCM uses 12 byte nonce.
  const iv = forge.random.getBytesSync(12);

  cipher.start({ iv: iv });
  cipher.update(forge.util.createBuffer(plainText));
  cipher.finish();

  const ciphertext = iv + cipher.output.getBytes() + cipher.mode.tag.getBytes();

  debug('Completed AES encryption of input. Ciphertext length is: ', ciphertext.length);
  return ciphertext;
}

/**
 * Encrypts the given input using the provided public key.
 *
 * @param plainText The plain text input to encrypt.
 * @param key The provided public key
 */
export async function rsaEncrypt(plainText: string, key: string): Promise<string> {
  return forge.pki.publicKeyFromPem(key).encrypt(plainText, 'RSA-OAEP', {
    md: forge.md.sha256.create(),
    label: '', // Force the label to be empty.
    mgf1: forge.md.sha256.create(),
  });
}
