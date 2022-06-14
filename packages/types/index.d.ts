export interface AttestationDocument {
  /**
   * The issuing Nitro Supervisor module ID.
   */
  module_id: string;
  /**
   * Digest function used for calculating the register values.
   */
  digest: string;
  /**
   * UTC time when document was created.
   */
  timestamp: number;
  /**
   * Map of all locked PCRs at the moment the document was created.
   */
  pcrs: Map<number, Uint8Array>;
  /**
   * The infrastructure certificate used to sign.
   */
  certificate: Uint8Array;
  /**
   * Issuing CA bundle for infrastructure certificate.
   */
  cabundle: Uint8Array[];
  /**
   *  DER-encoded key the attestation.
   */
  public_key: Uint8Array;
  /**
   * Additional signed user data.
   */
  user_data: Uint8Array;
  /**
   * Nonce provided by the consumer as a proof of authenticity.
   */
  nonce: number;
}
