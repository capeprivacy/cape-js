import { hybrid } from 'tink-crypto';
import { BinaryKeysetReader } from 'tink-crypto/internal/binary_keyset_reader';
import { readNoSecret } from 'tink-crypto/internal/keyset_handle';

/**
 * Encrypts the given input using the provided public key.
 *
 * @param inputBytes The input to encrypt.
 * @param publicKey The public key to use for encryption.
 * @param context The context to use for encryption.
 */
export async function encrypt(
  inputBytes: Uint8Array,
  publicKey: Uint8Array,
  context: Uint8Array = new Uint8Array(),
): Promise<Uint8Array> {
  hybrid.register();
  // const keyHandle = await generateNewKeysetHandle(publicKey);
  // const encrypt = await keyHandle.getPrimitive(aead.Aead);
  // return await encrypt.encrypt(inputBytes, context);
  const reader = new BinaryKeysetReader(publicKey);
  const khPub = readNoSecret(reader);
  const encrypt = await khPub.getPrimitive(hybrid.HybridEncrypt);
  return await encrypt.encrypt(inputBytes, context);
}
