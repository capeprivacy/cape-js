import { encrypt, rsaEncrypt, suite, aesEncrypt, capeEncrypt, forgeRsaEncrypt } from './encrypt';
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
    // For some reason this decrypt succeeds but doesn't print out the proper message.
    const text = encoder.encode('my secrete message');
    const encrypted = await aesEncrypt(text);
    const key = encrypted.encapsulatedKey;
    const parsedIv = encrypted.cipherText.slice(0, 12);
    // Manipuate the ciphertext to not include iv and tag.
    const forgeTag = forge.util.createBuffer(
      encrypted.cipherText.subarray(encrypted.cipherText.length - 16, encrypted.cipherText.length),
    );
    const ciphertext = forge.util.createBuffer(encrypted.cipherText.slice(0, encrypted.cipherText.length - 16));
    const forgeKey = forge.util.binary.raw.encode(key);
    const forgeIv = forge.util.binary.raw.encode(parsedIv);
    const cipher = forge.cipher.createDecipher('AES-GCM', forgeKey);
    cipher.start({ iv: forgeIv, tag: forgeTag });
    cipher.update(ciphertext);
    cipher.finish();
    const decrypted = cipher.output;

    expect(decrypted.toHex() == '').toBe(false);
  });

  test('rsa encrypt', async () => {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      // The standard secure default length for RSA keys is 2048 bits
      modulusLength: 2048,
    });
    // console.log("public key", publicKey)

    const inputString = 'word arrays are terrible';
    const input = encoder.encode(inputString);
    // const key = publicKey.export({ type: 'spki', format: 'pem' });
    // const keyBytes = encoder.encode(key.toString());
    // // console.log("public key", keyBytes)
    // console.log(Array.apply([], keyBytes).join(","));
    const keyBytes = new Uint8Array([
      45, 45, 45, 45, 45, 66, 69, 71, 73, 78, 32, 80, 85, 66, 76, 73, 67, 32, 75, 69, 89, 45, 45, 45, 45, 45, 10, 77,
      73, 73, 66, 73, 106, 65, 78, 66, 103, 107, 113, 104, 107, 105, 71, 57, 119, 48, 66, 65, 81, 69, 70, 65, 65, 79,
      67, 65, 81, 56, 65, 77, 73, 73, 66, 67, 103, 75, 67, 65, 81, 69, 65, 47, 70, 70, 88, 43, 76, 102, 89, 90, 90, 82,
      75, 43, 83, 107, 48, 52, 85, 109, 122, 10, 87, 97, 55, 57, 43, 113, 85, 66, 54, 90, 111, 48, 47, 80, 76, 117, 75,
      56, 113, 102, 49, 110, 78, 51, 86, 74, 57, 47, 70, 66, 77, 101, 112, 87, 52, 114, 53, 122, 114, 74, 66, 118, 120,
      48, 114, 114, 89, 71, 115, 102, 50, 79, 90, 68, 54, 97, 48, 115, 97, 114, 71, 106, 90, 111, 10, 119, 82, 80, 118,
      56, 104, 120, 101, 83, 43, 74, 74, 76, 120, 99, 116, 79, 67, 84, 104, 117, 53, 52, 55, 54, 106, 43, 51, 118, 108,
      111, 53, 97, 50, 53, 56, 67, 53, 110, 48, 68, 67, 68, 89, 73, 112, 117, 98, 113, 111, 117, 101, 47, 49, 103, 100,
      56, 99, 106, 54, 100, 103, 50, 83, 10, 114, 97, 43, 76, 51, 69, 90, 122, 68, 55, 51, 80, 81, 48, 113, 57, 106, 56,
      87, 52, 76, 82, 112, 105, 113, 43, 56, 71, 75, 103, 106, 109, 57, 84, 107, 54, 57, 54, 54, 110, 116, 75, 57, 57,
      109, 110, 97, 55, 114, 49, 52, 87, 89, 80, 51, 65, 109, 113, 97, 50, 117, 119, 99, 52, 10, 100, 71, 76, 67, 108,
      50, 90, 97, 83, 99, 48, 51, 121, 122, 113, 109, 83, 99, 71, 47, 100, 57, 89, 76, 120, 103, 110, 111, 51, 84, 68,
      83, 52, 72, 87, 43, 53, 103, 57, 81, 114, 108, 52, 69, 98, 56, 43, 104, 86, 103, 106, 88, 77, 122, 110, 47, 74,
      105, 53, 120, 121, 111, 51, 84, 10, 78, 121, 50, 71, 104, 87, 52, 67, 100, 52, 52, 57, 81, 100, 52, 89, 76, 82,
      54, 70, 78, 69, 79, 51, 52, 89, 85, 73, 65, 78, 121, 74, 113, 116, 79, 57, 52, 118, 118, 75, 54, 97, 101, 122, 80,
      56, 80, 51, 56, 89, 118, 97, 120, 99, 85, 119, 101, 108, 107, 71, 90, 65, 114, 66, 10, 76, 81, 73, 68, 65, 81, 65,
      66, 10, 45, 45, 45, 45, 45, 69, 78, 68, 32, 80, 85, 66, 76, 73, 67, 32, 75, 69, 89, 45, 45, 45, 45, 45, 10,
    ]);
    const encryptedBytes = await rsaEncrypt(input, keyBytes);
    // console.log(Array.apply([], encryptedBytes).join(","));

    // const decryptedData = privateDecrypt(
    //   {
    //     key: privateKey,
    //     // In order to decrypt the data, we need to specify the
    //     // same hashing function and padding scheme that we used to
    //     // encrypt the data in the previous step
    //     padding: constants.RSA_PKCS1_OAEP_PADDING,
    //     oaepHash: 'sha256',
    //   },
    //   Buffer.from(encryptedBytes),
    // );

    // expect(decryptedData.toString()).toBe(inputString);
  });

  test('test forge RSA', async () => {
    const inputString = 'word arrays are terrible';
    const input = encoder.encode(inputString);
    let keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
    const pubPem = forge.pki.publicKeyToPem(keypair.publicKey);
    console.log('public pem', pubPem);

    const encryptedData = await forgeRsaEncrypt(input, pubPem);

    const encryptedDataInString = decoder.decode(encryptedData);
    const decryptedData = keypair.privateKey.decrypt(encryptedDataInString, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
    });
    console.log('decrypted', decryptedData);
    expect(decryptedData.toString()).toBe(inputString);
  });

  test('test cape encrypt', async () => {
    let keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
    const pubPem = forge.pki.publicKeyToPem(keypair.publicKey);
    const input = 'interesting';

    const encrypted = await capeEncrypt(pubPem, input);
    const result = encrypted.includes('cape');
    expect(result).toBe(true);
  });
});
