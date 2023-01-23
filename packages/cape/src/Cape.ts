import loglevel from 'loglevel';
import { Methods } from './methods';
import { DataKey } from './encrypt';

export interface CapeInit {
  /**
   * The auth token to use when authenticating with Cape. This is required if a
   * functionToken is not provided.
   */
  authToken?: string;
  /**
   * The HTTP host to use when eing to Cape.
   * @internal
   */
  capeApiUrl?: string;
  /**
   * The websocket host to use when connecting to Cape.
   * @internal
   */
  enclaveUrl?: string;
  /**
   * Optional function hash for checking if the loaded function is one
   * that is expected by the caller.
   * If undefined, function hash will not be checked.
   */
  functionChecksum?: string;
  /**
   * Optional string containing a Cape function token generated by the Cape CLI
   * during `cape token`. If undefined, the authToken will be used instead.
   */
  functionToken?: string;
  /**
   * Enable verbose logging.
   */
  verbose?: boolean;

  /**
   * Enable a specific date to check the certificate against.
   * Will default to the current time.
   */
  checkDate?: Date;
}

export class Cape extends Methods {
  private readonly authToken: string | undefined;
  private readonly enclaveUrl: string;
  private readonly capeApiUrl: string;
  private readonly functionToken: string | undefined;
  private readonly functionChecksum: string | undefined;

  static DEFAULT_ENCLAVE_URL = 'wss://enclave.capeprivacy.com';
  static DEFAULT_API_URL = 'https://app.capeprivacy.com';

  constructor({ authToken, enclaveUrl, capeApiUrl, functionToken, functionChecksum, verbose, checkDate }: CapeInit = {}) {
    super();

    if (verbose) {
      loglevel.setLevel(loglevel.levels.TRACE);
    }

    this.authToken = authToken;
    this.enclaveUrl = enclaveUrl || Cape.DEFAULT_ENCLAVE_URL;
    this.capeApiUrl = capeApiUrl || Cape.DEFAULT_API_URL;
    this.checkDate = checkDate;
    this.functionToken = functionToken;
    this.functionChecksum = functionChecksum;
  }

  getCanonicalEnclavePath(path: string): string {
    return this.enclaveUrl + path;
  }

  getCanonicalApiPath(path: string): string {
    return this.capeApiUrl + path;
  }

  getAuthToken(): string | undefined {
    return this.authToken;
  }

  getFunctionToken(): string | undefined {
    return this.functionToken;
  }

  getFunctionChecksum(): string | undefined {
    return this.functionChecksum;
  }
}
