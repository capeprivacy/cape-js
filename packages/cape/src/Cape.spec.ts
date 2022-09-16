import { parseAttestationDocument } from '@capeprivacy/isomorphic';
import * as crypto from 'crypto';
import loglevel from 'loglevel';
import { Server } from 'mock-socket';
import * as pkijs from 'pkijs';
import { getPortPromise } from 'portfinder';
import { Cape } from './Cape';
import { WebsocketConnection } from './websocket-connection';

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
const host = 'ws://localhost';
const checkDate = new Date('2022-09-15T17:44:24.000Z');
const functionChecksum = '66731e5ccf226680dd5c98a1d1ad52b7a4c986984042d0672d8f3153130b34a8';

describe('Cape', () => {
  test('setting verbose to TRUE sets the log level to trace', () => {
    new Cape({ verbose: true, authToken, checkDate });
    expect(loglevel.getLevel()).toBe(loglevel.levels.TRACE);
  });

  describe('#connect', () => {
    test('when the id is not set, it should throw an error', async () => {
      const cape = new Cape({ authToken, checkDate });
      await expect(() => cape.connect({ id: '' })).rejects.toThrowError(
        'Unable to connect to the server, missing function id.',
      );
    });

    test('when the function hash is set and does not match, it should throw an error', async () => {
      const port = await getPortPromise({ host });
      const capeApiUrl = `${host}:${port}`;
      const id = 'XYZ';
      const mockServer = new Server(`${capeApiUrl}/v1/run/${id}`);
      const functionChecksum = 'runbad';
      mockServer.on('connection', (socket) => {
        socket.on('message', (data) => {
          if (typeof data === 'string') {
            const parsed = JSON.parse(data);
            // First message contains a nonce, send back the attestation document.
            if (parsed.message.nonce) {
              socket.send(JSON.stringify({ message: { message: attestationDocument, type: 'attestation_doc' } }));
            }
          }
        });
      });
      const cape = new Cape({ authToken, capeApiUrl, checkDate, functionChecksum });
      await expect(() => cape.connect({ id })).rejects.toThrowError(
        'Error validating function checksum, got 66731e5ccf226680dd5c98a1d1ad52b7a4c986984042d0672d8f3153130b34a8, wanted: runbad.',
      );
      await cape.disconnect();
    });

    test('when no token is present, it should throw an error', async () => {
      const cape = new Cape({ authToken: '', functionToken: '', checkDate });
      await expect(() => cape.connect({ id: 'test' })).rejects.toThrowError('Missing auth token.');
    });

    describe.each(['functionToken', 'authToken'])('when %s is present', (tokenType) => {
      test('when the server sends an error, it should throw an error', async () => {
        const port = await getPortPromise({ host });
        const capeApiUrl = `${host}:${port}`;
        const id = 'GHI';
        const mockServer = new Server(`${capeApiUrl}/v1/run/${id}`);
        const error = 'Something went really wrong.';

        mockServer.on('connection', (socket) => {
          socket.on('message', () => {
            socket.send(JSON.stringify({ message: null, error }));
          });
        });

        const cape = new Cape({ [tokenType]: authToken, capeApiUrl, checkDate });
        await expect(cape.connect({ id })).rejects.toThrowError(error);
        mockServer.stop();
      });

      test('when the server sends an invalid attestation document, it automatically disconnects', async () => {
        const port = await getPortPromise({ host });
        const capeApiUrl = `${host}:${port}`;
        const id = 'DEF';
        const mockServer = new Server(`${capeApiUrl}/v1/run/${id}`);
        const spy = jest.spyOn(Cape.prototype, 'disconnect');

        mockServer.on('connection', (socket) => {
          socket.on('message', () => {
            socket.send(JSON.stringify({ message: { message: '', type: 'attestation_doc' } }));
          });
        });

        const cape = new Cape({ [tokenType]: authToken, capeApiUrl, checkDate });
        await expect(cape.connect({ id })).rejects.toThrowError('Invalid attestation document');
        expect(spy).toHaveBeenCalled();
        jest.restoreAllMocks();
        mockServer.stop();
      });

      test('when the websocket server is already instantiated, it should throw an error', async () => {
        const id = 'ABC';
        const port = await getPortPromise({ host });
        const capeApiUrl = `${host}:${port}`;
        const mockServer = new Server(`${capeApiUrl}/v1/run/${id}`);

        mockServer.on('connection', (socket) => {
          socket.on('message', () => {
            socket.send(JSON.stringify({ message: { message: attestationDocument, type: 'attestation_doc' } }));
          });
        });

        const cape = new Cape({ [tokenType]: authToken, capeApiUrl, checkDate });
        await cape.connect({ id });

        await expect(() => cape.connect({ id })).rejects.toThrowError(
          'Unable to instantiate another websocket instance, already connected to the server.',
        );

        mockServer.stop();
      });

      test('when the server does not respond with an attestation document, it should throw an error', async () => {
        const id = 'ABC';
        const port = await getPortPromise({ host });
        const capeApiUrl = `${host}:${port}`;
        const mockServer = new Server(`${capeApiUrl}/v1/run/${id}`);

        mockServer.on('connection', (socket) => {
          socket.on('message', () => {
            socket.send(JSON.stringify({ message: { message: 'pong' } }));
          });
        });

        const client = new Cape({
          [tokenType]: authToken,
          capeApiUrl,
          checkDate,
        });
        await expect(client.connect({ id })).rejects.toThrowError(
          'Expected attestation document but received undefined',
        );

        client.disconnect();
        mockServer.stop();
      });

      test('should connect and set the public key', async () => {
        const id = 'ABC';
        const port = await getPortPromise({ host });
        const capeApiUrl = `${host}:${port}`;
        const mockServer = new Server(`${capeApiUrl}/v1/run/${id}`);

        mockServer.on('connection', (socket) => {
          socket.on('message', () => {
            socket.send(JSON.stringify({ message: { message: attestationDocument, type: 'attestation_doc' } }));
          });
        });

        const client = new Cape({
          [tokenType]: authToken,
          capeApiUrl,
          checkDate,
        });
        await client.connect({ id });

        expect(client.publicKey).toEqual(publicKey);

        client.disconnect();
        mockServer.stop();
      });
    });
  });

  describe('#run', () => {
    test('when the function id is missing, it should reject', async () => {
      const cape = new Cape({ authToken, checkDate });
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - we are testing the reject behavior
      await expect(cape.run({})).rejects.toThrowError('Unable to connect to the server, missing function id.');
    });

    test('should run a function without error', async () => {
      const id = 'ABC';
      const port = await getPortPromise({ host });
      const capeApiUrl = `${host}:${port}`;
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

      const client = new Cape({ authToken, capeApiUrl, checkDate });
      const result = await client.run({ id, data: 'ping' });

      expect(incomingMessageCount).toBe(2);
      expect(result).toBe('pong');

      mockServer.stop();
    });

    it.todo('when the nonce does not match what was sent, it should reject');
  });

  describe('#invoke', () => {
    test('when the websocket is not connected, it should reject', async () => {
      const cape = new Cape({ authToken, checkDate });
      await expect(cape.invoke({ data: 'ping' })).rejects.toThrowError(
        'Unable to invoke the function, not connected to the server.',
      );
    });

    test('when the public key is missing, it should reject', async () => {
      const cape = new Cape({ authToken, checkDate });
      const port = await getPortPromise({ host });
      const capeApiUrl = `${host}:${port}`;
      cape.websocket = new WebsocketConnection(capeApiUrl, []);

      await expect(cape.invoke({ data: 'ping' })).rejects.toThrowError(
        'Unable to invoke the function, missing public key.',
      );
    });

    test('can invoke several functions', async () => {
      const id = 'ABC';
      const port = await getPortPromise({ host });
      const capeApiUrl = `${host}:${port}`;
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

      const client = new Cape({ authToken, capeApiUrl, checkDate, functionChecksum });
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

      const client = new Cape({ authToken, capeApiUrl, checkDate });
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

    const client = new Cape({ authToken, capeApiUrl, checkDate, functionChecksum });
    await client.connect({ id });

    await expect(client.invoke({ data: 'ping' })).rejects.toThrowError(error);
  });
});
