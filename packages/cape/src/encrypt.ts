import { TextEncoder } from 'util';
import { Aead, CipherSuite, Kdf, Kem } from 'hpke-js';
import { randomBytes, publicEncrypt } from 'crypto';
import CryptoJS from 'crypto-js';
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
  const plainTextString = byteArrayToWordArray(plainText);
  // Generate a new key
  const key = new TextEncoder().encode('AES256Key-32Characters1234567890');
  // randomBytes(32);
  const keyString = byteArrayToWordArray(key);

  // aesGCM uses 12 byte nonce.
  const iv = byteArrayToWordArray(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]));
  // CryptoJS.lib.WordArray.random(12);

  // Library encrypt call expects everything in wordarray format.
  const encrypted = CryptoJS.AES.encrypt(plainTextString, keyString, { iv: iv });
  const ivArray = wordArrayToByteArray(iv, null);
  const ciphertextArray = wordArrayToByteArray(encrypted.ciphertext, null);
  const mergedArray = new Uint8Array(ivArray.length + ciphertextArray.length);
  mergedArray.set(ivArray);
  mergedArray.set(ciphertextArray, ivArray.length);
  return { cipherText: mergedArray, encapsulatedKey: new Uint8Array(key) };
}

export async function rsaEncrypt(plainText: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
  const keyBuffer = Buffer.from(key);
  const buffer = Buffer.from(plainText);
  const encrypted = publicEncrypt(keyBuffer, buffer);
  const cipherText = new Uint8Array(encrypted);
  return cipherText;
}

/**
 * Helper function to convert byte array to word array since
 * CryptoJS doesn't support this by default.
 * referenced from https://gist.github.com/artjomb/7ef1ee574a411ba0dd1933c1ef4690d1
 */
export function byteArrayToWordArray(ba: Uint8Array) {
  var wa = [],
    i;
  for (i = 0; i < ba.length; i++) {
    wa[(i / 4) | 0] |= ba[i] << (24 - 8 * i);
  }

  return CryptoJS.lib.WordArray.create(wa, ba.length);
}

function wordToByteArray(word, length) {
  var ba = [],
    i,
    xFF = 0xff;
  if (length > 0) ba.push(word >>> 24);
  if (length > 1) ba.push((word >>> 16) & xFF);
  if (length > 2) ba.push((word >>> 8) & xFF);
  if (length > 3) ba.push(word & xFF);

  return ba;
}

export function wordArrayToByteArray(wordArray, length) {
  if (wordArray.hasOwnProperty('sigBytes') && wordArray.hasOwnProperty('words')) {
    length = wordArray.sigBytes;
    wordArray = wordArray.words;
  }

  var result = [],
    bytes,
    i = 0;
  while (length > 0) {
    bytes = wordToByteArray(wordArray[i], Math.min(4, length));
    length -= bytes.length;
    result.push(bytes);
    i++;
  }
  // Known to have problems with large files.
  // https://stackoverflow.com/questions/58937464/cryptojs-maximum-call-stack-size-exceeded-in-wordarray-to-bytearray-conversion/58937696#58937696
  return [].concat.apply([], result);
}
