import { WebsocketConnection } from './websocket-connection';
import { base64Decode, type BytesInput, getBytes, parseAttestationDocument } from '@capeprivacy/isomorphic';
import { encrypt } from './encrypt';
import { Data } from 'isomorphic-ws';

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
  type: string;
  message: string;
}

export abstract class Methods {
  public abstract getCanonicalPath(path: string): string;
  public abstract getAuthToken(): string;
  publicKey?: Uint8Array;
  websocket: WebsocketConnection;
  nonce: string;

  /**
   * Connect to the Cape server.
   */
  public async connect({ id }: ConnectArgs): Promise<void> {
    // Ensure we have the required function ID. If not, reject and terminate the control flow.
    if (!id) {
      throw new Error('Unable to connect to the server, missing function id.');
    }
    if (this.websocket) {
      throw new Error('Unable to initiate another instance, already connected to the server.');
    }
    // Set up the connection to the server
    this.websocket = new WebsocketConnection(this.getCanonicalPath(`/v1/run/${id}`));
    this.websocket.connect();

    // Generate the nonce for the connection.
    this.nonce = generateNonce();

    // Send the nonce and auth token to the server to kick off the function.
    await this.websocket.send(JSON.stringify({ nonce: this.nonce, auth_token: this.getAuthToken() }));

    // Wait for the server to send back the attestation document with the public key.
    const result = this.parseMessage(await this.websocket.receive());
    if (result.type !== 'attestation_doc') {
      throw new Error(`Expected attestation document but received ${result.type}.`);
    }
    this.publicKey = parseAttestationDocument(result.message).public_key;
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
   * Run a single function within an enclave. This method will connect to the server, run a single function, disconnect,
   * and return the result.
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
    await this.connect({ id });
    const response = await this.invoke({ data });
    this.disconnect();
    return response;
  }

  /**
   * Invoke a function within an enclave.
   * @param data - The function input data.
   * @returns The result of the function ran inside the enclave.
   */
  public async invoke({ data }: InvokeArgs): Promise<string> {
    if (!this.websocket) {
      throw new Error('Unable to invoke the function, not connected to the server. Call Cape.connect() first.');
    }
    if (!this.publicKey) {
      throw new Error('Unable to invoke the function, missing public key. Call Cape.connect() first.');
    }
    const cypherText = await encrypt(getBytes(data), this.publicKey, getBytes(''));
    await this.websocket.send(cypherText);
    const result = this.parseMessage(await this.websocket.receive());
    return base64Decode(result.message);
  }

  /**
   * Parse the incoming frame from the server and return the message.
   *
   * @param frame - The incoming frame from the server
   * @returns The message from the server
   * @private
   */
  private parseMessage(frame: Data): Message {
    if (typeof frame !== 'string') {
      throw new Error('Invalid message received from the server.');
    }
    return JSON.parse(frame);
  }
}

function generateNonce() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();
}
