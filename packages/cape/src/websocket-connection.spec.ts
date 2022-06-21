import { Server } from 'mock-socket';
import { WebsocketConnection } from './websocket-connection';

// eslint-disable-next-line @typescript-eslint/no-var-requires
jest.mock('isomorphic-ws', () => require('mock-socket').WebSocket);

describe('WebSocketConnection', () => {
  describe('#connect', () => {
    it('should connect and disconnect', async () => {
      const url = 'ws://localhost:8000';
      const mockServer = new Server(url);

      const ws = new WebsocketConnection(url);
      await ws.connect();

      expect(ws.connected).toBe(true);

      ws.close();

      expect(ws.connected).toBe(false);
      expect(ws.isClosed).toBe(true);

      mockServer.stop();
    });

    it('should throw when the server does not connect', async () => {
      const url = 'ws://localhost:8082';
      const ws = new WebsocketConnection(url);
      await expect(ws.connect()).rejects.toThrowError('Websocket error. Closing connection');
    });
  });

  it('should error when the server disconnects', async () => {
    const url = 'ws://localhost:8001';
    const mockServer = new Server(url);

    mockServer.on('connection', (socket) => {
      socket.on('message', () => {
        socket.close({ code: 1011, reason: 'bye', wasClean: true });
      });
    });

    const ws = new WebsocketConnection(url);
    await ws.connect();

    ws.send('hello');
    ws.close();
  });

  describe('#receive', () => {
    it('when there are messages, should return the message', async () => {
      const url = 'ws://localhost:8280';
      const mockServer = new Server(url);

      mockServer.on('connection', (socket) => {
        socket.on('message', () => {
          socket.send('world');
        });
      });

      const ws = new WebsocketConnection(url);
      await ws.connect();

      ws.send('hello');

      const resp = await ws.receive();
      expect(resp).toBe('world');

      ws.close();
      mockServer.close();
    });

    it('when the websocket server is not connected, it should throw an error', async () => {
      const ws = new WebsocketConnection('ws://localhost:8000');
      await expect(() => ws.receive()).rejects.toThrowError('WebSocket connection not open');
    });

    it('when the connection is open, but no messages are available, it should wait to resolve', (done) => {
      const url = 'ws://localhost:8291';
      const mockServer = new Server(url);

      mockServer.on('connection', (socket) => {
        socket.on('message', () => {
          socket.send('world');
        });
      });

      const ws = new WebsocketConnection(url);
      ws.connect().then(() => {
        ws.receive().then((message) => {
          expect(message).toBe('world');
          ws.close();
          mockServer.close();
          done();
        });

        setTimeout(() => {
          ws.send('hello');
        }, 100);
      });
    });

    it('when sending multiple messages, it should return each message', async () => {
      let counter = 0;
      const url = 'ws://localhost:8292';
      const mockServer = new Server(url);

      mockServer.on('connection', (socket) => {
        socket.on('message', () => {
          counter++;
          socket.send(`world-${counter}`);
        });
      });

      const ws = new WebsocketConnection(url);
      await ws.connect();

      ws.send('hello-1');
      ws.send('hello-2');
      ws.send('hello-3');

      await expect(ws.receive()).resolves.toBe('world-1');
      await expect(ws.receive()).resolves.toBe('world-2');
      await expect(ws.receive()).resolves.toBe('world-3');

      ws.close();
      mockServer.close();
    });

    it('should queue received messages', async () => {
      const url = 'ws://localhost:2818';
      const mockServer = new Server(url);

      mockServer.on('connection', (socket) => {
        socket.send(`hello-1`);
        socket.send(`hello-2`);
        socket.send(`hello-3`);
      });

      const ws = new WebsocketConnection(url);
      await ws.connect();

      expect(ws.messagesAvailable).toBe(3);

      await expect(ws.receive()).resolves.toBe('hello-1');
      await expect(ws.receive()).resolves.toBe('hello-2');
      await expect(ws.receive()).resolves.toBe('hello-3');

      expect(ws.messagesAvailable).toBe(0);

      ws.close();
      mockServer.close();
    });
  });
});
