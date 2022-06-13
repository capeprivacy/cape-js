export interface AttestationDocument {
  module_id: string;
  digest: string;
  timestamp: number;
  pcrs: Map<number, Uint8Array>;
  certificate: Uint8Array;
  cabundle: Uint8Array[];
  public_key: Uint8Array;
  user_data: any;
  nonce: any;
}
