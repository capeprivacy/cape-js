import WebSocket, { Data } from 'isomorphic-ws';
import { debug, error } from 'loglevel';

interface Callback {
  resolve: (x: Data) => void;
  reject: () => void;
}

export class WebsocketConnection {
  /**
   * The WebSocket instance.
   * @private
   */
  private socket: WebSocket | undefined | null;
  /**
   * The url to the websocket server.
   * @private
   */
  private readonly url: string;
  /**
   * The message queue. We use this queue to store messages received from the server.
   * @private
   */
  private messageQueue: Data[] = [];
  /**
   * The callbacks queue. We use queue to buffer receive calls.
   * @private
   */
  private callbacksQueue: Callback[] = [];
  /**
   * Is the websocket connection closed?
   */
  isClosed = false;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Is the websocket connection open?
   */
  get connected(): boolean {
    return this.socket && this.socket.readyState === 1;
  }

  // TODO: WebSocket connection timeout

  /**
   * The number of messages available.
   */
  get messagesAvailable(): number {
    return this.messageQueue.length;
  }

  /**
   * The number of callbacks available.
   */
  get callbacksAvailable(): number {
    return this.callbacksQueue.length;
  }

  receive(): Promise<Data> {
    if (this.messagesAvailable) {
      return Promise.resolve(this.messageQueue.shift());
    }

    if (!this.connected) {
      return Promise.reject(new Error('Websocket connection not open'));
    }

    return new Promise((resolve, reject) => {
      this.callbacksQueue.push({ resolve, reject });
    });
  }

  /**
   * Open a connection to the websocket server.
   */
  connect() {
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      debug('Websocket connection opened');
    };

    this.socket.onclose = (e) => {
      debug('Websocket onclose', e);
      this.onClose();
    };

    this.socket.onmessage = (message) => {
      this.handleMessage(message);
    };

    this.socket.onerror = (e) => {
      debug('Websocket error. Closing connection');
      error(e?.message);

      this.onClose();
    };
  }

  /**
   * Close the websocket connection.
   */
  close() {
    this.onClose();
  }

  /**
   * Send a message to the server.
   *
   * @param data - Data to send to the server.
   */
  send(data: Data): Promise<void> {
    return new Promise((resolve) => {
      this.waitForConnection(() => {
        debug('Sending websocket message', data);
        this.socket?.send(data);
        resolve();
      });
    });
  }

  /**
   * An on close event handler.
   *
   * @private
   */
  private onClose() {
    if (!this.isClosed) {
      debug('Websocket connection closed');
      this.isClosed = true;

      if (this.socket) {
        this.socket.close();
        this.socket = null;
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
    const { data } = message;
    debug('Websocket message received', data);

    if (this.callbacksAvailable) {
      this.callbacksQueue.shift().resolve(data);
      return;
    }

    this.messageQueue.push(data);
  }

  /**
   * Wait for the websocket connection to be open. This prevents messages from being sent before the connection has
   * been established with the server.
   *
   * @param callback - Callback to execute when the connection is open.
   */
  private waitForConnection(callback: () => void) {
    if (this.connected) return callback();

    setTimeout(() => {
      this.waitForConnection(callback);
    }, 10);
  }
}
