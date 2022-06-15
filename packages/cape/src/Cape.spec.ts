import { Cape } from './Cape';
import { Server } from 'mock-socket';
import { readFileSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-var-requires
jest.mock('isomorphic-ws', () => require('mock-socket').WebSocket);

const authToken = 'abc';
const file = readFileSync(join(__dirname, '../attestation.bin'));

describe('Cape', () => {
  beforeEach(() => {
    // Tink depends on crypto.getRandomValues which exists off window.crypto, but is not globally available in Node.js,
    // so it must be mocked.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.crypto = crypto.webcrypto;
  });
  describe('#run', () => {
    it('when the function id is missing, it should reject', async () => {
      const cape = new Cape({ authToken });
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - we are testing the reject behavior
      await expect(cape.run({})).rejects.toThrowError('Unable to run the function, missing function id.');
    });

    it('should run a function without error', async () => {
      const id = 'ABC';
      const capeApiUrl = 'ws://localhost:8000';
      const mockServer = new Server(`${capeApiUrl}/v1/run/${id}`);
      let incomingMessageCount = 0;

      mockServer.on('connection', (socket) => {
        socket.on('message', (data) => {
          incomingMessageCount++;

          if (typeof data === 'string') {
            const parsed = JSON.parse(data);
            // First message contains a nonce, send back the attestation document.
            if (parsed.nonce) {
              socket.send(JSON.stringify({ message: Buffer.from(file).toString('base64'), type: 'attestation_doc' }));
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
});
