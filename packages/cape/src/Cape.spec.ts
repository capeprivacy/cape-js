import { parseAttestationDocument } from '@capeprivacy/isomorphic';
import * as crypto from 'crypto';
import loglevel from 'loglevel';
import { Server } from 'mock-socket';
import * as pkijs from 'pkijs';
import { getPortPromise } from 'portfinder';
import { Cape } from './Cape';
import { WebsocketConnection } from './websocket-connection';
import * as forge from 'node-forge';

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
// CheckDate can be found by logging the notBefore and notAfter time in the certificate
// by adding console.log("not after:", cert.notAfter, "not before:", cert.notBefore);
// in https://github.com/capeprivacy/cape-js/blob/main/packages/isomorphic/src/verify-cert-chain-node.ts#L18
const functionChecksum = '66731e5ccf226680dd5c98a1d1ad52b7a4c986984042d0672d8f3153130b34a8';
const keyAttestationDocument =
  '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aG96OEdlb3VYQ21Sb1lUL2NyZklqTnE0Rm5LYjZNTXNHT2RUMWFTL1VVWU81a3Z0ejcvZ1RYRTc5UmZRVVJXU3Q2b0kzaEJKUWcvNjI5anUxWVZwbFhJSUtRVnlacXdTYWloWTZodFc5SFM0UDlMUEVzRk9JUEZ2dDArb2d3Y1lmdWI2K25CbEJPOC9VZDFUSkNsMW85TWdrTWY1WVZqQUVuWThJanh1SmpHSTZmNTNmb0xTZC9TdW91OEJPK2ZDa2UxcDgyQnY3ZmpwQmx3ejNsdkRtcXp6Y21GNTZMOFJ1L25YRDZ2eEJwMzRNa093TklLclpXVHhuTGJnR0twazFrMFQrMkdwMnZhaERlcUhuL0JHbXRCUkV6YmNEYjJvTnBuaWtCZjBlVkpBRUdNOEovcHdRWFV0MmFmUnBTSitQRFQ3TmgzbTE5OU5naFVTSGJFenpBdm9pYjlCVnJsWUp2cnZJbGRCVU1wYm9YRkZuMEhPa3U0T2NkcENEdXlhdWtsQ01GbkswWW5xT1V6WEJva1hRbGtScU81SEd4U044b2JZbUJXUkRPTGtOeDN3QWhoRGtyUitzeEZwcWsrck1GUGpZeDNraEJSVzFGdU1ERHNLVFliVXJSSFdJMG9SdDE3TnBKZ0JsUlFXRUpmUzByWVRScGo1SUFLNnBCSlI4V1IwOFdwb09UVzAzY3V0RXo1U2ZJb25KQUZBUGhub3FwNndzQjUvN0pUemNpQStxQU1DQXdFQUFRPT0ifWVub25jZUys25/+h31cnMm/gRVYYOeaEuTsh6/fWWwkwyx+Cyh11qS8AOXgaCd2Se6uN4l9xkjWHG7llOfNPOq7h+WapsyDr2PyO7viZjjotu1k+9wCdGrYLSORjYEVdXVuSfFyvFVPuovu7fGSiROzmq0rkg==';
const keyCheckDate = new Date('2022-09-28T16:34:00.000Z');
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

  describe('#key', () => {
    test('when token is missing, should reject', async () => {
      const cape = new Cape({ checkDate: keyCheckDate });
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - we are testing the reject behavior
      await expect(cape.run({})).rejects.toThrowError('Unable to connect to the server, missing function id.');
    });

    test('should fetch a key without error', async () => {
      const port = await getPortPromise({ host });
      const capeApiUrl = `${host}:${port}`;
      const mockServer = new Server(`${capeApiUrl}/v1/key`);

      mockServer.on('connection', (socket) => {
        socket.on('message', (data) => {
          if (typeof data === 'string') {
            const parsed = JSON.parse(data);
            // First message contains a nonce, send back the attestation document.
            if (parsed.message.nonce) {
              socket.send(JSON.stringify({ message: { message: keyAttestationDocument, type: 'attestation_doc' } }));
            }
          } else {
            socket.send(
              JSON.stringify({ message: { message: Buffer.from('pong').toString('base64'), type: 'function_result' } }),
            );
          }
        });
      });

      const client = new Cape({ authToken, capeApiUrl, checkDate: keyCheckDate });
      const result = await client.key();
      const expected = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAnV8eokFPI6Nx+MJ+4iBG
+5Ms1W2qadbuKf8pFL3s8aEsLp4MSH7809b8nsLhgxtbs+nBh1CNaoOxkxY2bhhH
Kv8gmnkP0kuH0dRKz9Egf0R3CV+vA+lnRnZThoz8GeouXCmRoYT/crfIjNq4FnKb
6MMsGOdT1aS/UUYO5kvtz7/gTXE79RfQURWSt6oI3hBJQg/629ju1YVplXIIKQVy
ZqwSaihY6htW9HS4P9LPEsFOIPFvt0+ogwcYfub6+nBlBO8/Ud1TJCl1o9MgkMf5
YVjAEnY8IjxuJjGI6f53foLSd/Suou8BO+fCke1p82Bv7fjpBlwz3lvDmqzzcmF5
6L8Ru/nXD6vxBp34MkOwNIKrZWTxnLbgGKpk1k0T+2Gp2vahDeqHn/BGmtBREzbc
Db2oNpnikBf0eVJAEGM8J/pwQXUt2afRpSJ+PDT7Nh3m199NghUSHbEzzAvoib9B
VrlYJvrvIldBUMpboXFFn0HOku4OcdpCDuyauklCMFnK0YnqOUzXBokXQlkRqO5H
GxSN8obYmBWRDOLkNx3wAhhDkrR+sxFpqk+rMFPjYx3khBRW1FuMDDsKTYbUrRHW
I0oRt17NpJgBlRQWEJfS0rYTRpj5IAK6pBJR8WR08WpoOTW03cutEz5SfIonJAFA
Phnoqp6wsB5/7JTzciA+qAMCAwEAAQ==
-----END PUBLIC KEY-----`;
      expect(result).toBe(expected);

      mockServer.stop();
    });
  });

  describe('#encrypt', () => {
    test('when token is missing, should reject', async () => {
      const cape = new Cape({ checkDate: keyCheckDate });
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - we are testing the reject behavior
      await expect(cape.run({})).rejects.toThrowError('Unable to connect to the server, missing function id.');
    });

    test('should fetch a key and encrypt success', async () => {
      const port = await getPortPromise({ host });
      const capeApiUrl = `${host}:${port}`;
      const mockServer = new Server(`${capeApiUrl}/v1/key`);

      mockServer.on('connection', (socket) => {
        socket.on('message', (data) => {
          if (typeof data === 'string') {
            const parsed = JSON.parse(data);
            // First message contains a nonce, send back the attestation document.
            if (parsed.message.nonce) {
              socket.send(JSON.stringify({ message: { message: keyAttestationDocument, type: 'attestation_doc' } }));
            }
          } else {
            socket.send(
              JSON.stringify({ message: { message: Buffer.from('pong').toString('base64'), type: 'function_result' } }),
            );
          }
        });
      });

      const client = new Cape({ authToken, capeApiUrl, checkDate: keyCheckDate });
      const encrypted = await client.encrypt('my message');
      const result = encrypted.includes('cape');
      expect(result).toBe(true);
      mockServer.stop();
    });

    test('should take optional key and encrypt success', async () => {
      const port = await getPortPromise({ host });
      const capeApiUrl = `${host}:${port}`;

      const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });

      const pem = forge.pki.publicKeyToPem(keypair.publicKey);

      const client = new Cape({ authToken, capeApiUrl, checkDate: keyCheckDate });
      const encrypted = await client.encrypt('my message', pem);

      const b64 = encrypted.slice(5);
      const decoded = forge.util.decode64(b64);
      const ciphertextKey = decoded.slice(0, 256);

      const aesKey = keypair.privateKey.decrypt(ciphertextKey, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        label: '', // Force the label to be empty.
        mgf1: forge.md.sha256.create(),
      });

      const ciphertext = decoded.slice(256);

      const parsedIv = ciphertext.slice(0, 12);
      const ciphertextBuffer = forge.util.createBuffer(ciphertext.slice(12, ciphertext.length - 16));
      const tagBuffer = forge.util.createBuffer(ciphertext.slice(ciphertext.length - 16, ciphertext.length));

      const cipher = forge.cipher.createDecipher('AES-GCM', aesKey);
      cipher.start({ iv: parsedIv, tag: tagBuffer });
      cipher.update(ciphertextBuffer);
      cipher.finish();

      const decrypted = cipher.output;

      expect(decrypted.toString()).toBe('my message');
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
