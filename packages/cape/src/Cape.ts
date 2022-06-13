import { Methods } from './methods';

export interface CapeInit {
  /**
   * The auth token to use when authenticating with Cape.
   */
  authToken: string;
  /**
   * The websocket host to use when connecting to Cape.
   * @internal
   */
  capeApiUrl?: string;
}

export class Cape extends Methods {
  private readonly authToken: string;
  private readonly capeApiUrl: string;

  static DEFAULT_CAPE_API_URL = 'wss://cape.run';

  constructor({ authToken, capeApiUrl }: CapeInit) {
    super();

    this.authToken = authToken;
    this.capeApiUrl = capeApiUrl || Cape.DEFAULT_CAPE_API_URL;
  }

  getCanonicalPath(path: string): string {
    return this.capeApiUrl + path;
  }

  getAuthToken(): string {
    return this.authToken;
  }
}
