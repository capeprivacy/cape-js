import { Methods } from './methods';
import loglevel from 'loglevel';

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
  /**
   * Enable verbose logging.
   */
  verbose?: boolean;
}

export class Cape extends Methods {
  private readonly authToken: string;
  private readonly capeApiUrl: string;

  static DEFAULT_CAPE_API_URL = 'wss://hackathon.capeprivacy.com';

  constructor({ authToken, capeApiUrl, verbose }: CapeInit) {
    super();

    if (verbose) {
      loglevel.setLevel(loglevel.levels.TRACE);
    }

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
