import {
  base64Decode,
  getAWSRootCert,
  getBytes,
  parseAttestationDocument,
  TextDecoder,
  verifyCertChain,
  verifySignature,
  type BytesInput,
} from '@capeprivacy/isomorphic';
import { randomBytes } from 'crypto';
import { type Data } from 'isomorphic-ws';
import { AttestationDocument } from '@capeprivacy/types';
import { concat } from './bytes';
import { encrypt, rsaEncrypt, aesEncrypt, DataKey } from './encrypt';
import { WebsocketConnection } from './websocket-connection';
import * as forge from 'node-forge';

interface ConnectArgs {
  /**
   * The function ID to run.
   */
  id: string;
}

/**
 * The configuration object for the `run` method.
 */
interface RunArguments {
  /**
   * The function ID to run.
   */
  id: string;
  /**
   * The function input data.
   */
  data: BytesInput;
}

interface InvokeArgs {
  /**
   * The function input data.
   */
  data: BytesInput;
}

interface Message {
  message: {
    type: string;
    message: string;
  };
  error: string;
}

interface EncryptOptions {
  key?: string;
  dek?: string;
}

export abstract class Methods {
  public abstract getCanonicalEnclavePath(path: string): string;
  public abstract getCanonicalApiPath(path: string): string;
  public abstract getAuthToken(): string | undefined;
  public abstract getFunctionToken(): string | undefined;
  public abstract getFunctionChecksum(): string | undefined;

  publicKey?: Uint8Array;
  websocket?: WebsocketConnection;
  nonce?: string;
  checkDate?: Date;
  dataKeyCache: Map<string, DataKey>;

  /**
   * Get the authentication token and protocol for the websocket connection.
   */
  private getAuthentication(): [string, string] {
    const functionToken = this.getFunctionToken();
    if (functionToken && functionToken.length > 0) {
      return ['cape.function', functionToken];
    }

    const authToken = this.getAuthToken();
    if (authToken && authToken.length > 0) {
      return ['cape.runtime', authToken];
    }

    throw new Error('Missing auth token.');
  }

  /**
   * Connect to the Cape server.
   * Note that the connection with automatically close after 60 seconds of inactivity.
   */
  public async connect({ id }: ConnectArgs): Promise<void> {
    // Ensure we have the required function ID. If not, reject and terminate the control flow.
    if (!id || id.length === 0) {
      throw new Error('Unable to connect to the server, missing function id.');
    }
    if (this.websocket) {
      throw new Error('Unable to instantiate another websocket instance, already connected to the server.');
    }

    const functionChecksum = this.getFunctionChecksum() || '';
    const path = this.getCanonicalEnclavePath(`/v1/run/${id}`);
    const attestationUserData = await this.connect_(path);
    const obj = JSON.parse(attestationUserData);
    const userData = obj.func_checksum;
    const buffer = Buffer.from(userData, 'base64');
    const bufString = buffer.toString('hex');
    if (functionChecksum !== '' && functionChecksum !== bufString) {
      throw new Error(`Error validating function checksum, got ${bufString}, wanted: ${functionChecksum}.`);
    }
  }

  /**
   * Close the connection to the Cape server.
   */
  public disconnect() {
    this.websocket?.close();
    this.websocket = undefined;
    this.publicKey = undefined;
    this.nonce = undefined;
  }

  /**
   * Run a single function. This method will manage the entire lifecycle for you.
   *
   * @returns The result of the function ran inside the enclave.
   *
   * @example
   * ```ts
   * const client = new Cape({ authToken: 'my-auth-token' });
   * const result = await client.run({ id: 'my-function-id', data: 'my-function-input' });
   * ```
   */
  public async run({ id, data }: RunArguments): Promise<string> {
    try {
      await this.connect({ id });
      return await this.invoke({ data });
    } finally {
      this.disconnect();
    }
  }

  /**
   * Invoke a function. This method is useful is you need to perform multiple invocations of the same function without
   * closing the connection to the server.
   *
   * You will need to manage the entire lifecycle of the connection to the server when calling this method. To invoke
   * commands against the server start with `connect` before invoking any functions, then `invoke` as many times as you
   * need, and then call `disconnect` whenever you are finished.
   *
   * @param data - The function input data.
   * @returns The result of the function ran inside the enclave.
   *
   * @example
   * ```ts
   * const client = new Cape({ authToken: 'my-auth-token' });
   * await client.connect({ id: 'my-function-id' });
   * const results = await Promise.all([
   *   client.invoke({ data: 'my-data-1' }),
   *   client.invoke({ data: 'my-data-2' }),
   *   client.invoke({ data: 'my-data-3' }),
   * ]);
   * client.disconnect();
   * ```
   */
  public async invoke({ data }: InvokeArgs): Promise<string> {
    if (!this.websocket) {
      throw new Error('Unable to invoke the function, not connected to the server. Call Cape.connect() first.');
    }
    if (!this.publicKey) {
      throw new Error('Unable to invoke the function, missing public key. Call Cape.connect() first.');
    }
    try {
      const { cipherText, plaintextDek } = await encrypt(getBytes(data), this.publicKey);
      const input = concat(plaintextDek, cipherText);

      this.websocket.send(input);

      const result = parseFrame(await this.websocket.receive());
      if (result.error) {
        throw new Error(result.error);
      }
      return base64Decode(result.message.message);
    } catch (e) {
      this.disconnect();
      throw e;
    }
  }

  /**
   * Retrieve a Cape key using your authentication token or function token. This method will manage the entire lifecycle for you.
   * The returned key is stored in the `client` object as a parameter for encrypt.
   *
   * @example
   * ```ts
   * const client = new Cape({ authToken: 'my-auth-token' });
   * await key = client.key();
   * ```
   */
  public async key(username?: string): Promise<string> {
    if (username != null) {
      const path = this.getCanonicalApiPath(`/v1/user/${username}/key`);
      const response = await fetch(path, { headers: { Authorization: `Bearer ${this.getAuthToken()}` } });
      const data = await response.json();
      if (data.error != undefined) {
        throw new Error(data.error);
      }

      if (data.message != undefined) {
        throw new Error(data.message);
      }

      const doc = await this.verifyAttestationDocument(data.attestation_document);

      const obj = JSON.parse(new TextDecoder().decode(doc.user_data));

      return '-----BEGIN PUBLIC KEY-----\n' + addNewLines(obj.key) + '\n-----END PUBLIC KEY-----';
    }

    try {
      const path = this.getCanonicalEnclavePath(`/v1/key`);

      const attestationUserData = await this.connect_(path);
      const obj = JSON.parse(attestationUserData);

      return '-----BEGIN PUBLIC KEY-----\n' + addNewLines(obj.key) + '\n-----END PUBLIC KEY-----';
    } finally {
      this.disconnect();
    }
  }

  public async generateDataKey(key?: string): Promise<DataKey> {
    if (key == null) {
      key = await this.key();
    }

    const dataKey = this.dataKeyCache.get(key);
    if (dataKey != undefined) {
      return dataKey;
    }

    const plaintext = forge.random.getBytesSync(32);

    const ciphertext = await rsaEncrypt(plaintext, key);

    const newDataKey = { plaintext: plaintext, ciphertext: ciphertext };

    this.dataKeyCache.set(key, newDataKey);

    return newDataKey;
  }

  /**
   * Encrypt the input.
   *
   * Encrypt takes options which allow you customize what RSA key or
   * data encryption key (dek) is used. You cannot pass a custom RSA key
   * and dek. This function will return an error if you do.
   *
   * @example
   * ```ts
   * const myInput = <YOUR_INPUT>;
   * const client = new Cape({ authToken: 'my-auth-token' });
   * await key = client.key();
   * const encrypted = client.encrypt(myInput, { key })
   *
   * ```
   */
  public async encrypt(input: string, options: EncryptOptions = { key: undefined, dek: undefined }): Promise<string> {
    if (options.key != null && options.dek != null) {
      throw Error('cannot pass key and dek to this function');
    }

    if (options.dek != null) {
      // TODO ??
      throw Error('not implemented');
    }

    const dataKey = await this.generateDataKey(options.key);

    const ciphertext = await aesEncrypt(input, dataKey);

    return 'cape:' + forge.util.encode64(dataKey.ciphertext + ciphertext);
  }

  /**
   * Connect to the Cape server with a specific endpoint and return the embedded user data field.
   * Note that the connection with automatically close after 60 seconds of inactivity.
   */
  private async connect_(endpoint: string): Promise<string> {
    try {
      // Set up the connection to the server
      this.websocket = new WebsocketConnection(endpoint, this.getAuthentication());
      await this.websocket.connect();

      // Generate the nonce for the connection.
      this.nonce = generateNonce();

      // Send the nonce and auth token to the server to kick off the function.
      this.websocket.send(JSON.stringify({ message: { nonce: this.nonce } }));

      // Wait for the server to send back the attestation document with the public key.
      const result = parseFrame(await this.websocket.receive());
      if (result.error) {
        throw new Error(result.error);
      }
      const { type, message } = result.message;
      if (type !== 'attestation_doc') {
        throw new Error(`Expected attestation document but received ${type}.`);
      }

      const doc = await this.verifyAttestationDocument(message);

      this.publicKey = doc.public_key;
      return new TextDecoder().decode(doc.user_data);
    } catch (e) {
      this.disconnect();
      throw e;
    }
  }

  private async verifyAttestationDocument(message: string): Promise<AttestationDocument> {
    const doc = parseAttestationDocument(message);

    await verifySignature(Buffer.from(message, 'base64'), doc.certificate);

    const rootCert = await getAWSRootCert('https://aws-nitro-enclaves.amazonaws.com/AWS_NitroEnclaves_Root-G1.zip');

    const certResult = await verifyCertChain(doc, rootCert, this.checkDate);
    if (!certResult.result) {
      throw new Error(`Error validating certificate chain ${certResult.resultCode} ${certResult.resultMessage}.`);
    }

    return doc;
  }
}

/**
 * Parse the incoming frame from the server and return the message.
 *
 * @param frame - The incoming frame from the server
 * @returns The message from the server
 */
function parseFrame(frame: Data | undefined): Message {
  if (typeof frame !== 'string') {
    throw new Error('Invalid message received from the server.');
  }
  return JSON.parse(frame);
}

/**
 * Generate a fixed length of bytes for the nonce.
 */
function generateNonce() {
  return randomBytes(12).toString('base64');
}

/**
 * Utility function for adding a newline character every n characters in string.
 * @param orgStr - The string to format.
 * @param numChar - number of characters before adding a new line, default is 65.
 * @returns The result string
 */
function addNewLines(orgStr: string, numChar = 65) {
  let result = '';
  while (orgStr.length > numChar - 1) {
    result += orgStr.substring(0, numChar - 1) + '\n';
    orgStr = orgStr.substring(numChar - 1);
  }
  // Append the last portion remaining from orgString.
  result += orgStr;
  return result;
}
