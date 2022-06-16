import WebSocket, { Data } from 'isomorphic-ws';
import { debug, error } from 'loglevel';

export class WebsocketConnection {
  private socket: WebSocket | undefined | null;
  private readonly url: string;
  onMessage?: (message: Data) => void;
  onDisconnect?: (graceful: boolean) => void;
  frames: WebSocket.MessageEvent[] = [];
  isClosed = false;

  constructor(url: string) {
    this.url = url;
  }

  // TODO: WebSocket connection timeout

  /**
   * Open a connection to the websocket server.
   *
   * @param onMessage - Callback to handle messages from the server.
   * @param onDisconnect - Callback when the websocket connection is closed.
   */
  open(onMessage: (message: Data) => void, onDisconnect: (graceful: boolean) => void) {
    this.onMessage = onMessage;
    this.onDisconnect = onDisconnect;

    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      debug('Websocket connection opened');
    };

    this.socket.onclose = (e) => {
      debug('Websocket onclose', e);
      this.onClose(true);
    };

    this.socket.onmessage = (message) => {
      this.handleMessage(message);
    };

    this.socket.onerror = (e) => {
      debug('Websocket error. Closing connection');
      error(e?.message);

      this.onClose(false);
    };
  }

  /**
   * Close the websocket connection.
   */
  close(graceful = true) {
    this.onClose(graceful);
  }

  /**
   * Send a message to the server.
   *
   * @param data - Data to send to the server.
   */
  send(data: Data) {
    this.waitForConnection(() => {
      debug('Sending websocket message', data);
      this.socket?.send(data);
    });
  }

  /**
   * An on close event handler.
   *
   * @param graceful - Was the connection closed gracefully?
   * @private
   */
  private onClose(graceful: boolean) {
    if (!this.isClosed) {
      debug('Websocket connection closed');
      this.isClosed = true;

      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }

      if (this.onDisconnect) {
        this.onDisconnect(graceful);
        this.onDisconnect = undefined;
      }
    }
  }

  /**
   * Handle a message from the server.
   *
   * @param message
   * @private
   */
  private handleMessage(message: WebSocket.MessageEvent) {
    this.frames.push(message);
    const { data } = message;
    debug('Websocket message received', data);
    this.onMessage?.(data);
  }

  /**
   * Wait for the websocket connection to be open. This prevents messages from being sent before the connection has
   * been established with the server.
   *
   * @param callback - Callback to execute when the connection is open.
   */
  private waitForConnection(callback: () => void) {
    if (this.socket?.readyState === 1) return callback();

    setTimeout(() => {
      this.waitForConnection(callback);
    }, 10);
  }
}
