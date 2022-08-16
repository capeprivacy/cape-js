import WebSocket, { type Data, type MessageEvent } from 'isomorphic-ws';
import { debug, error } from 'loglevel';

interface Callback {
  resolve: (x: Data) => void;
  reject: () => void;
}

export class WebsocketConnection {
  private readonly options?: WebSocket.ClientOptions;
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

  constructor(url: string, options?: WebSocket.ClientOptions) {
    this.url = url;
    this.options = options;
  }

  /**
   * Is the websocket connection open?
   */
  get connected(): boolean {
    return !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  // TODO: WebSocket connection timeout

  /**
   * The number of messages available.
   */
  get messagesAvailable(): number {
    return this.messageQueue.length;
  }

  receive(): Promise<Data | undefined> {
    if (this.messagesAvailable) {
      return Promise.resolve(this.messageQueue.shift());
    }

    if (!this.connected) {
      return Promise.reject(new Error('WebSocket connection not open'));
    }

    return new Promise((resolve, reject) => {
      this.callbacksQueue.push({ resolve, reject });
    });
  }

  /**
   * Open a connection to the websocket server.
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.url, '', this.options);

      this.socket.onopen = () => {
        debug('Websocket connection opened');
        this.isClosed = false;
        resolve();
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

        // This will only reject whenever the initial onopen callback is not called.
        reject(new Error('Websocket error. Closing connection'));
      };
    });
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
  send(data: Data) {
    debug('Sending websocket message', data);
    this.socket?.send(data);
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
   * @param message - The incoming message from the server.
   * @private
   */
  private handleMessage(message: MessageEvent) {
    const { data } = message;
    debug('Websocket message received', data);

    if (this.callbacksQueue.length) {
      this.callbacksQueue.shift()?.resolve(data);
      return;
    }

    this.messageQueue.push(data);
  }
}
