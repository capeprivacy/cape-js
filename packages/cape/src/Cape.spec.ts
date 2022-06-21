import { Cape } from './Cape';
import { Server } from 'mock-socket';
import { readFileSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import { WebsocketConnection } from './websocket-connection';
import { parseAttestationDocument } from '@capeprivacy/isomorphic';

// eslint-disable-next-line @typescript-eslint/no-var-requires
jest.mock('isomorphic-ws', () => require('mock-socket').WebSocket);

const authToken = 'abc';
const file = readFileSync(join(__dirname, '../attestation.bin'));
const attestationDocument = Buffer.from(file).toString('base64');
const publicKey = parseAttestationDocument(attestationDocument).public_key;

describe('Cape', () => {
  beforeEach(() => {
    // Tink depends on crypto.getRandomValues which exists off window.crypto, but is not globally available in Node.js,
    // so it must be mocked.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.crypto = crypto.webcrypto;
  });

  describe('#connect', () => {
    test('when the id is not set, it should throw an error', () => {
      const cape = new Cape({ authToken });
      expect(() => cape.connect({ id: '' })).rejects.toThrowError(
        'Unable to connect to the server, missing function id.',
      );
    });

    test('when the websocket server is already instantiated, it should throw an error', async () => {
      const id = 'ABC';
      const capeApiUrl = 'ws://localhost:8021';
      const mockServer = new Server(`${capeApiUrl}/v1/run/${id}`);

      mockServer.on('connection', (socket) => {
        socket.on('message', () => {
          socket.send(JSON.stringify({ message: attestationDocument, type: 'attestation_doc' }));
        });
      });

      const cape = new Cape({ authToken, capeApiUrl });
      await cape.connect({ id });

      await expect(() => cape.connect({ id })).rejects.toThrowError(
        'Unable to instantiate another websocket instance, already connected to the server.',
      );

      mockServer.stop();
    });

    test('when the server does not respond with an attestation document, it should throw an error', async () => {
      const id = 'ABC';
      const capeApiUrl = 'ws://localhost:8281';
      const mockServer = new Server(`${capeApiUrl}/v1/run/${id}`);

      mockServer.on('connection', (socket) => {
        socket.on('message', () => {
          socket.send(JSON.stringify({ message: 'pong' }));
        });
      });

      const client = new Cape({ authToken, capeApiUrl });
      await expect(client.connect({ id })).rejects.toThrowError('Expected attestation document but received undefined');

      client.disconnect();
      mockServer.stop();
    });

    test('should connect and set the public key', async () => {
      const id = 'ABC';
      const capeApiUrl = 'ws://localhost:8281';
      const mockServer = new Server(`${capeApiUrl}/v1/run/${id}`);

      mockServer.on('connection', (socket) => {
        socket.on('message', () => {
          socket.send(JSON.stringify({ message: attestationDocument, type: 'attestation_doc' }));
        });
      });

      const client = new Cape({ authToken, capeApiUrl });
      await client.connect({ id });

      expect(client.publicKey).toEqual(publicKey);

      client.disconnect();
      mockServer.stop();
    });
  });

  describe('#run', () => {
    test('when the function id is missing, it should reject', async () => {
      const cape = new Cape({ authToken });
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - we are testing the reject behavior
      await expect(cape.run({})).rejects.toThrowError('Unable to connect to the server, missing function id.');
    });

    test('should run a function without error', async () => {
      const id = 'ABC';
      const capeApiUrl = 'ws://localhost:8829';
      const mockServer = new Server(`${capeApiUrl}/v1/run/${id}`);
      let incomingMessageCount = 0;

      mockServer.on('connection', (socket) => {
        socket.on('message', (data) => {
          incomingMessageCount++;

          if (typeof data === 'string') {
            const parsed = JSON.parse(data);
            // First message contains a nonce, send back the attestation document.
            if (parsed.nonce) {
              socket.send(JSON.stringify({ message: attestationDocument, type: 'attestation_doc' }));
            }
          } else {
            socket.send(JSON.stringify({ message: Buffer.from('pong').toString('base64'), type: 'function_result' }));
          }
        });
      });

      const client = new Cape({ authToken, capeApiUrl });
      const result = await client.run({ id, data: 'ping' });

      expect(incomingMessageCount).toBe(2);
      expect(result).toBe('pong');

      mockServer.stop();
    });

    it.todo('when the nonce does not match what was sent, it should reject');
  });

  describe('#invoke', () => {
    test('when the websocket is not connected, it should reject', async () => {
      const cape = new Cape({ authToken });
      await expect(cape.invoke({ data: 'ping' })).rejects.toThrowError(
        'Unable to invoke the function, not connected to the server.',
      );
    });

    test('when the public key is missing, it should reject', async () => {
      const cape = new Cape({ authToken });
      cape.websocket = new WebsocketConnection('ws://localhost:1288');

      await expect(cape.invoke({ data: 'ping' })).rejects.toThrowError(
        'Unable to invoke the function, missing public key.',
      );
    });

    test('can invoke several functions', async () => {
      const id = 'ABC';
      const capeApiUrl = 'ws://localhost:1929';
      const mockServer = new Server(`${capeApiUrl}/v1/run/${id}`);
      let incomingMessageCount = 0;

      mockServer.on('connection', (socket) => {
        socket.on('message', (data) => {
          incomingMessageCount++;

          if (typeof data === 'string') {
            const parsed = JSON.parse(data);
            // First message contains a nonce, send back the attestation document.
            if (parsed.nonce) {
              socket.send(JSON.stringify({ message: attestationDocument, type: 'attestation_doc' }));
            }
          } else {
            socket.send(
              JSON.stringify({
                message: Buffer.from(`pong-${incomingMessageCount}`).toString('base64'),
                type: 'function_result',
              }),
            );
          }
        });
      });

      const client = new Cape({ authToken, capeApiUrl });
      await client.connect({ id });

      const result1 = await client.invoke({ data: 'ping' });
      const result2 = await client.invoke({ data: 'ping' });
      const result3 = await client.invoke({ data: 'ping' });

      await client.disconnect();

      // ping * 3 + attestation document
      expect(incomingMessageCount).toBe(4);

      expect(result1).toBe('pong-2');
      expect(result2).toBe('pong-3');
      expect(result3).toBe('pong-4');

      mockServer.stop();
    });

    test('when the server responds with an unknown message, it should throw an error', async () => {
      const id = 'ABC';
      const capeApiUrl = 'ws://localhost:1929';
      const mockServer = new Server(`${capeApiUrl}/v1/run/${id}`);

      mockServer.on('connection', (socket) => {
        socket.on('message', (data) => {
          if (typeof data === 'string') {
            const parsed = JSON.parse(data);
            // First message contains a nonce, send back the attestation document.
            if (parsed.nonce) {
              socket.send(JSON.stringify({ message: attestationDocument, type: 'attestation_doc' }));
            }
          } else {
            socket.send(new ArrayBuffer(25));
          }
        });
      });

      const client = new Cape({ authToken, capeApiUrl });
      await client.connect({ id });

      await expect(client.invoke({ data: 'ping' })).rejects.toThrowError('Invalid message received from the server.');

      mockServer.stop();
    });
  });
});
