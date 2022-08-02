import { type Data } from 'isomorphic-ws';
import { WebsocketConnection } from './websocket-connection';
import {
  base64Decode,
  type BytesInput,
  getBytes,
  parseAttestationDocument,
  verifySignature,
  verifyCertChain,
  getAWSRootCert,
} from '@capeprivacy/isomorphic';
import { concat } from './bytes';
import { encrypt } from './encrypt';

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

export abstract class Methods {
  public abstract getCanonicalPath(path: string): string;
  public abstract getAuthToken(): string;
  publicKey?: Uint8Array;
  websocket?: WebsocketConnection;
  nonce?: string;
  checkDate?: Date;

  /**
   * Connect to the Cape server.
   */
  public async connect({ id }: ConnectArgs): Promise<void> {
    // Ensure we have the required function ID. If not, reject and terminate the control flow.
    if (!id || id.length === 0) {
      throw new Error('Unable to connect to the server, missing function id.');
    }
    if (this.websocket) {
      throw new Error('Unable to instantiate another websocket instance, already connected to the server.');
    }
    try {
      // Set up the connection to the server
      this.websocket = new WebsocketConnection(this.getCanonicalPath(`/v1/run/${id}`));
      await this.websocket.connect();

      // Generate the nonce for the connection.
      this.nonce = generateNonce();

      // Send the nonce and auth token to the server to kick off the function.
      this.websocket.send(JSON.stringify({ message: { nonce: this.nonce, auth_token: this.getAuthToken() } }));

      // Wait for the server to send back the attestation document with the public key.
      const result = parseFrame(await this.websocket.receive());
      if (result.error) {
        throw new Error(result.error);
      }
      const { type, message } = result.message;
      if (type !== 'attestation_doc') {
        throw new Error(`Expected attestation document but received ${type}.`);
      }
      const doc = parseAttestationDocument(message);

      verifySignature(Buffer.from(message, 'base64'), doc.certificate);

      const rootCert = await getAWSRootCert('https://aws-nitro-enclaves.amazonaws.com/AWS_NitroEnclaves_Root-G1.zip');

      const certResult = await verifyCertChain(doc, rootCert, this.checkDate);
      if (!certResult.result) {
        throw new Error(`Error validating certificate chain ${certResult.resultCode} ${certResult.resultMessage}.`);
      }

      this.publicKey = doc.public_key;
    } catch (e) {
      this.disconnect();
      throw e;
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
      const { cipherText, encapsulatedKey } = await encrypt(getBytes(data), this.publicKey);
      this.websocket.send(concat(encapsulatedKey, cipherText));
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

function generateNonce() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();
}
