import { Server } from 'mock-socket';
import { WebsocketConnection } from './websocket-connection';
import loglevel from 'loglevel';

loglevel.setLevel('debug');

// eslint-disable-next-line @typescript-eslint/no-var-requires
jest.mock('isomorphic-ws', () => require('mock-socket').WebSocket);

describe('WebSocketConnection', () => {
  it('should connect and disconnect', async () => {
    const url = 'ws://localhost:8000';
    const mockServer = new Server(url);
    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        if (typeof data === 'string') {
          socket.send('world');
        }
      });
    });

    const ws = new WebsocketConnection(url);
    ws.open(
      (message) => {
        expect(message).toBe('world');
        ws.close(true);
      },
      (graceful) => {
        expect(graceful).toBe(true);
        expect(ws.frames).toHaveLength(1);
        mockServer.stop();
      },
    );
    ws.send('hello');
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
    ws.open(
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      (graceful) => {
        expect(graceful).toBe(false);
        expect(ws.frames).toHaveLength(0);
        mockServer.stop();
      },
    );
    ws.send('hello');
  });

  it('can close the connection', (done) => {
    const url = 'ws://localhost:8000';
    const mockServer = new Server(url);
    mockServer.on('connection', () => {
      // noop
    });
    mockServer.on('close', () => {
      mockServer.stop();
      done();
    });

    const ws = new WebsocketConnection(url);
    ws.open(
      () => {
        // noop
      },
      (graceful) => {
        expect(graceful).toBe(true);
        expect(ws.frames).toHaveLength(0);
      },
    );
    ws.close(true);
  });
});
