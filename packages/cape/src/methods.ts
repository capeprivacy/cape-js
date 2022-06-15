import { WebsocketConnection } from './websocket-connection';
import { base64Decode, type BytesInput, getBytes, parseAttestationDocument } from '@cape/isomorphic';
import type { AttestationDocument, WebSocketMessage } from '@cape/types';
import { encrypt } from './encrypt';

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

export abstract class Methods {
  public abstract getCanonicalPath(path: string): string;
  public abstract getAuthToken(): string;

  /**
   * Run a function within an enclave.
   *
   * @returns The result of the function ran inside the enclave.
   */
  public run({ id, data }: RunArguments): Promise<string> {
    return new Promise((resolve, reject) => {
      // Ensure we have the required function ID. If not, reject and terminate the control flow.
      if (!id) {
        return reject(new Error('Unable to run the function, missing function id.'));
      }

      // Create a websocket connection to the enclave server.
      const ws = new WebsocketConnection(this.getCanonicalPath(`/v1/run/${id}`));
      const nonce = generateNonce();
      let attestationDocument: AttestationDocument;
      let functionResult: string;

      const messageTypes = {
        // When the message is for an attestation document, parse the document, and then send the encrypted inputs as a
        // message to the server.
        attestation_doc: async (message: string) => {
          attestationDocument = parseAttestationDocument(message);

          // Encrypt the inputs using the public key from the attestation document.
          const cypherText = await encrypt(getBytes(data), attestationDocument.public_key, getBytes(nonce.toString()));

          // Send the encrypted inputs as a websocket message to the enclave.
          ws.send(cypherText);
        },

        // When the message is for the result of the function, decode the result, close the websocket connection, and
        // return it.
        function_result: (message: string) => {
          functionResult = base64Decode(message);
          resolve(functionResult);
          ws.close();
        },
      };

      // Listen for messages from the enclave server.
      ws.open(
        async (message) => {
          if (typeof message === 'string') {
            const result: WebSocketMessage = JSON.parse(message);
            messageTypes[result.type]?.(result.message);
          }
        },
        (graceful) => {
          graceful ? resolve(functionResult) : reject();
        },
      );

      // Send nonce to the server to kick off the function.
      ws.send(JSON.stringify({ nonce, authToken: this.getAuthToken() }));
    });
  }
}

function generateNonce() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();
}
