import { WebsocketConnection } from './websocket-connection';
import { parseAttestationDocument } from '@cape/attestation';
import type { AttestationDocument } from '@cape/types';

interface RunArguments {
  /**
   * The function ID to run.
   */
  id: string;
}

export abstract class Methods {
  public abstract getCanonicalPath(path: string): string;

  /**
   * Run a function within an enclave.
   *
   * 1. Establish a websocket connection with the enclave including the Function ID in the url path.
   * 2. Send the nonce for attestation as a websocket message to the enclave (this is where the auth token will be sent in the future)
   * 3. Receive the attestation_document as a websocket message from the enclave.
   * 4. Send the encrypted inputs as a websocket message to the enclave.
   * 5. Receive the response as a websocket message from the enclave.
   */
  public run({ id }: RunArguments): Promise<void> {
    return new Promise((resolve, reject) => {
      // Ensure we have the required function ID. If not, reject and terminate
      // the control flow.
      if (!id) {
        return reject(new Error('Unable to run the function, missing function id argument.'));
      }

      // Create a websocket connection to the enclave server.
      const ws = new WebsocketConnection(this.getCanonicalPath(`/v1/run/${id}`));
      let attestationDocument: AttestationDocument;
      const nonce = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

      // Listen for messages from the enclave server.
      ws.open(
        (message) => {
          const result = JSON.parse(message);

          // When the message is for an attestation document, parse the document,
          // and then send the encrypted inputs as a message to the server.
          if (result.type === 'attestation_doc') {
            attestationDocument = parseAttestationDocument(result.message);

            ws.close();
          }

          // Finally, wait for a message from the server. Shutdown the websocket
          // and resolve the promise with the data from the server.
        },
        (graceful) => {
          graceful ? resolve() : reject();
        },
      );

      // Send nonce to the server to kick off the function.
      ws.send({ nonce, authToken: 'not_implemented' });
    });
  }
}
