import { TextEncoder } from 'util';
import { TextDecoder } from '@capeprivacy/isomorphic';
import { Aead, CipherSuite, Kdf, Kem } from 'hpke-js';
import { randomBytes, publicEncrypt } from 'crypto';
import CryptoJS from 'crypto-js';
<script src="http://crypto-js.googlecode.com/svn/tags/3.1/build/components/lib-typedarrays.js"></script>;
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
  // CryptoJS doesn't provide encoding to string so we use TextDecoder.
  // Note that this would limit some special characters in what we want to encrypt
  // because we don't use base64 encoding.
  const plainTextString = arrayToBase64_(plainText);
  // Generate a new key
  const key = randomBytes(32);
  const keyString = arrayToBase64_(key);

  // aesGCM uses 12 byte nonce.
  const iv = CryptoJS.lib.WordArray.random(16);

  console.log('iv', keyString);
  // Library encrypt call expects everything in string format.
  const encrypted = CryptoJS.AES.encrypt(plainTextString, keyString, { iv: iv });
  const ivString = toString(iv);
  console.log('iv', ivString);
  const ciphertextString = toString(encrypted.ciphertext);
  const returnVal = new TextEncoder().encode(ivString + ciphertextString);
  return { cipherText: returnVal, encapsulatedKey: new Uint8Array(key) };
}

export async function rsaEncrypt(plainText: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
  const keyBuffer = Buffer.from(key);
  const buffer = Buffer.from(plainText);
  const encrypted = publicEncrypt(keyBuffer, buffer);
  const cipherText = new Uint8Array(encrypted);
  return cipherText;
}

function toString(words: CryptoJS.lib.WordArray) {
  return CryptoJS.enc.Base64.stringify(words);
}

/**
 * Helper function to convert everything to base64 string
 */
function arrayToBase64_(array: Uint8Array) {
  var binary = '';
  var len = array.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return window.btoa(binary);
}
