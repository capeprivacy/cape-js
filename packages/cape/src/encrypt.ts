import { binary, hybrid } from 'tink-crypto';

/**
 * Encrypts the given input using the provided public key.
 *
 * @param inputBytes The input to encrypt.
 * @param publicKey The public key to use for encryption.
 */
export async function encrypt(inputBytes: Uint8Array, publicKey: Uint8Array): Promise<Uint8Array> {
  hybrid.register();
  const keyHandle = binary.deserializeNoSecretKeyset(publicKey);
  const encrypt = await keyHandle.getPrimitive<hybrid.HybridEncrypt>(hybrid.HybridEncrypt);
  return encrypt.encrypt(inputBytes);
}
