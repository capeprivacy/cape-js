import WebSocket from 'isomorphic-ws';

export class WebsocketConnection {
  private socket: WebSocket | undefined;
  private readonly url: string;
  onMessage?: (message: any) => void;
  onDisconnect?: (graceful: boolean) => void;
  frames: WebSocket.MessageEvent[] = [];

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
  open(onMessage: (message: string) => void, onDisconnect: (graceful: boolean) => void) {
    this.onMessage = onMessage;
    this.onDisconnect = onDisconnect;

    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log('Websocket connection opened');
    };

    this.socket.onclose = () => {
      this.onClose(true);
    };

    this.socket.onmessage = (message) => {
      this.handleMessage(message);
    };

    this.socket.onerror = (error) => {
      console.log('Websocket error. Closing connection');
      console.error(error?.message);

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
  send(data: any) {
    this.waitForConnection(() => {
      console.log('Sending websocket message', data);
      this.socket?.send(data);
    });
  }

  /**
   * An on close e
   * @param graceful - Was the connection closed gracefully?
   * @private
   */
  private onClose(graceful: boolean) {
    console.log('Websocket connection closed');

    if (this.onDisconnect) {
      this.onDisconnect(graceful);
      this.onDisconnect = undefined;
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
    console.log('message received', data);
    this.onMessage?.(data);
  }

  /**
   * Wait for the websocket connection to be open. This prevents messages from
   * being sent before the connection has been established with the server.
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
