export interface AttestationDocument {
  module_id: string;
  digest: string;
  timestamp: number;
  pcrs: Map<number, Buffer>;
  certificate: Buffer;
  cabundle: Buffer[];
  public_key: Buffer;
  user_data: any;
  nonce: any;
}
