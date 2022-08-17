import { Cape } from './Cape';
import { Server } from 'mock-socket';
import { WebsocketConnection } from './websocket-connection';
import { parseAttestationDocument } from '@capeprivacy/isomorphic';
import loglevel from 'loglevel';
import * as pkijs from 'pkijs';
import * as crypto from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-var-requires
jest.mock('isomorphic-ws', () => require('mock-socket').WebSocket);

beforeEach(() => {
  const name = 'nodeEngine';
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  pkijs.setEngine(name, new pkijs.CryptoEngine({ name, crypto: crypto.webcrypto }));
});

const authToken = 'abc';
const attestationDocument =
  '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';
const publicKey = parseAttestationDocument(attestationDocument).public_key;

describe('Cape', () => {
  test('setting verbose to TRUE sets the log level to trace', () => {
    new Cape({ verbose: true, authToken, checkDate: new Date('2022-07-12T21:34:04.000Z') });
    expect(loglevel.getLevel()).toBe(loglevel.levels.TRACE);
  });

  describe('#connect', () => {
    test('when the id is not set, it should throw an error', async () => {
      const cape = new Cape({ authToken, checkDate: new Date('2022-07-12T21:34:04.000Z') });
      await expect(() => cape.connect({ id: '' })).rejects.toThrowError(
        'Unable to connect to the server, missing function id.',
      );
    });

    test('when no auth token is present, it should throw an error', async () => {
      const cape = new Cape({ authToken: '', checkDate: new Date('2022-07-12T21:34:04.000Z') });
      await expect(() => cape.connect({ id: 'test' })).rejects.toThrowError('Missing auth token.');
    });

    test('when the server sends an error, it should throw an error', async () => {
      const id = 'GHI';
      const capeApiUrl = 'ws://localhost:82812';
      const mockServer = new Server(`${capeApiUrl}/v1/run/${id}`);
      const error = 'Something went really wrong.';

      mockServer.on('connection', (socket) => {
        socket.on('message', () => {
          socket.send(JSON.stringify({ message: null, error }));
        });
      });

      const cape = new Cape({ authToken, capeApiUrl, checkDate: new Date('2022-07-12T21:34:04.000Z') });
      await expect(cape.connect({ id })).rejects.toThrowError(error);
    });

    test('when the server sends an invalid attestation document, it automatically disconnects', async () => {
      const id = 'DEF';
      const capeApiUrl = 'ws://localhost:8282';
      const mockServer = new Server(`${capeApiUrl}/v1/run/${id}`);
      const spy = jest.spyOn(Cape.prototype, 'disconnect');

      mockServer.on('connection', (socket) => {
        socket.on('message', () => {
          socket.send(JSON.stringify({ message: { message: '', type: 'attestation_doc' } }));
        });
      });

      const cape = new Cape({ authToken, capeApiUrl, checkDate: new Date('2022-07-12T21:34:04.000Z') });
      await expect(cape.connect({ id })).rejects.toThrowError('Invalid attestation document');
      expect(spy).toHaveBeenCalled();
      jest.restoreAllMocks();
    });

    test('when the websocket server is already instantiated, it should throw an error', async () => {
      const id = 'ABC';
      const capeApiUrl = 'ws://localhost:8021';
      const mockServer = new Server(`${capeApiUrl}/v1/run/${id}`);

      mockServer.on('connection', (socket) => {
        socket.on('message', () => {
          socket.send(JSON.stringify({ message: { message: attestationDocument, type: 'attestation_doc' } }));
        });
      });

      const cape = new Cape({ authToken, capeApiUrl, checkDate: new Date('2022-07-12T21:34:04.000Z') });
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
          socket.send(JSON.stringify({ message: { message: 'pong' } }));
        });
      });

      const client = new Cape({ authToken, capeApiUrl, checkDate: new Date('2022-07-12T21:34:04.000Z') });
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
          socket.send(JSON.stringify({ message: { message: attestationDocument, type: 'attestation_doc' } }));
        });
      });

      const client = new Cape({ authToken, capeApiUrl, checkDate: new Date('2022-07-12T21:34:04.000Z') });
      await client.connect({ id });

      expect(client.publicKey).toEqual(publicKey);

      client.disconnect();
      mockServer.stop();
    });
  });

  describe('#run', () => {
    test('when the function id is missing, it should reject', async () => {
      const cape = new Cape({ authToken, checkDate: new Date('2022-07-12T21:34:04.000Z') });
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
            if (parsed.message.nonce) {
              socket.send(JSON.stringify({ message: { message: attestationDocument, type: 'attestation_doc' } }));
            }
          } else {
            socket.send(
              JSON.stringify({ message: { message: Buffer.from('pong').toString('base64'), type: 'function_result' } }),
            );
          }
        });
      });

      const client = new Cape({ authToken, capeApiUrl, checkDate: new Date('2022-07-12T21:34:04.000Z') });
      const result = await client.run({ id, data: 'ping' });

      expect(incomingMessageCount).toBe(2);
      expect(result).toBe('pong');

      mockServer.stop();
    });

    it.todo('when the nonce does not match what was sent, it should reject');
  });

  describe('#invoke', () => {
    test('when the websocket is not connected, it should reject', async () => {
      const cape = new Cape({ authToken, checkDate: new Date('2022-07-12T21:34:04.000Z') });
      await expect(cape.invoke({ data: 'ping' })).rejects.toThrowError(
        'Unable to invoke the function, not connected to the server.',
      );
    });

    test('when the public key is missing, it should reject', async () => {
      const cape = new Cape({ authToken, checkDate: new Date('2022-07-12T21:34:04.000Z') });
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
            if (parsed.message.nonce) {
              socket.send(JSON.stringify({ message: { message: attestationDocument, type: 'attestation_doc' } }));
            }
          } else {
            socket.send(
              JSON.stringify({
                message: {
                  message: Buffer.from(`pong-${incomingMessageCount}`).toString('base64'),
                  type: 'function_result',
                },
              }),
            );
          }
        });
      });

      const client = new Cape({ authToken, capeApiUrl, checkDate: new Date('2022-07-12T21:34:04.000Z') });
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

    test('when the server responds with an unknown message, it should throw an error and disconnect', async () => {
      const id = 'ABC';
      const capeApiUrl = 'ws://localhost:1282';
      const mockServer = new Server(`${capeApiUrl}/v1/run/${id}`);
      const spy = jest.spyOn(Cape.prototype, 'disconnect');

      mockServer.on('connection', (socket) => {
        socket.on('message', (data) => {
          if (typeof data === 'string') {
            const parsed = JSON.parse(data);
            // First message contains a nonce, send back the attestation document.
            if (parsed.message.nonce) {
              socket.send(JSON.stringify({ message: { message: attestationDocument, type: 'attestation_doc' } }));
            }
          } else {
            socket.send(new ArrayBuffer(25));
          }
        });
      });

      const client = new Cape({ authToken, capeApiUrl, checkDate: new Date('2022-07-12T21:34:04.000Z') });
      await client.connect({ id });

      await expect(client.invoke({ data: 'ping' })).rejects.toThrowError('Invalid message received from the server.');
      expect(spy).toHaveBeenCalled();

      jest.restoreAllMocks();
      mockServer.stop();
    });
  });

  test('when the server responds with an error, it should throw the error', async () => {
    const id = 'ABC';
    const capeApiUrl = 'ws://localhost:8122';
    const mockServer = new Server(`${capeApiUrl}/v1/run/${id}`);
    const error = 'Something went wrong';

    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        if (typeof data === 'string') {
          const parsed = JSON.parse(data);
          // First message contains a nonce, send back the attestation document.
          if (parsed.message.nonce) {
            socket.send(JSON.stringify({ message: { message: attestationDocument, type: 'attestation_doc' } }));
          }
        } else {
          socket.send(JSON.stringify({ message: null, error }));
        }
      });
    });

    const client = new Cape({ authToken, capeApiUrl, checkDate: new Date('2022-07-12T21:34:04.000Z') });
    await client.connect({ id });

    await expect(client.invoke({ data: 'ping' })).rejects.toThrowError(error);
  });
});
