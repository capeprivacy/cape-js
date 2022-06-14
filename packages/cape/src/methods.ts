import { WebsocketConnection } from './websocket-connection';
import { base64Decode, getBytes, parseAttestationDocument } from '@cape/isomorphic';
import type { AttestationDocument } from '@cape/types';
import { encrypt } from './enclave-encrypt';

interface RunArguments {
  /**
   * The function ID to run.
   */
  id: string;
  data: string;
}

export abstract class Methods {
  public abstract getCanonicalPath(path: string): string;
  public abstract getAuthToken(): string;

  /**
   * Run a function within an enclave.
   *
   * @param args - The arguments to pass to the function.
   * @param data - The data to encrypt and send to the enclave.
   * @returns The result of the function.
   */
  public run<TResult = unknown>({ id, data }: RunArguments): Promise<TResult> {
    return new Promise((resolve, reject) => {
      // Ensure we have the required function ID. If not, reject and terminate the control flow.
      if (!id) {
        return reject(new Error('Unable to run the function, missing function id argument.'));
      }

      // Create a websocket connection to the enclave server.
      const ws = new WebsocketConnection(this.getCanonicalPath(`/v1/run/${id}`));
      const nonce = generateNonce();
      let attestationDocument: AttestationDocument;
      let functionResult: TResult;

      // Listen for messages from the enclave server.
      ws.open(
        async (message) => {
          const result = JSON.parse(message);

          // When the message is for an isomorphic document, parse the document, and then send the encrypted inputs as
          // a message to the server.
          if (result.type === 'attestation_doc') {
            attestationDocument = parseAttestationDocument(result.message);

            // TODO: Remove as it's for testing
            attestationDocument.nonce = nonce;

            // Verify the isomorphic document nonce matches the nonce we sent.
            if (attestationDocument.nonce !== nonce) {
              reject(new Error('Nonce received did not match the nonce sent.'));
              ws.close(false);
              return;
            }

            // Encrypt the inputs using the public key from the isomorphic document.
            const cypherText = await encrypt(getBytes(data), attestationDocument.public_key, getBytes('abcdef'));

            // Send the encrypted inputs as a websocket message to the enclave.
            ws.send(cypherText);
          } else if (result.type === 'function_result') {
            functionResult = base64Decode(result.message);
            resolve(functionResult);
            ws.close();
          }

          // Finally, wait for a message from the server. Shutdown the websocket and resolve the promise with the data
          // from the server.
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
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}
