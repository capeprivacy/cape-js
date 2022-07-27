import 'cbor-rn-prereqs'; // Fixes TextDecoder not found issue and must be imported before cbor
import { decodeFirstSync, encode } from 'cbor';
import { Certificate, getCrypto } from 'pkijs';
import { Signature } from '@capeprivacy/types';
import { ec } from 'elliptic';

import * as nodeCrypt from 'crypto';

const EMPTY_BUFFER = Buffer.alloc(0);

export const verifySignature = async (doc: Buffer, certificate: Uint8Array): Promise<boolean> => {
  const crypto = getCrypto();

  const cert = Certificate.fromBER(certificate);
  const pub = await cert.getPublicKey();
  const raw = await crypto?.exportKey('raw', pub);
  if (raw === undefined) {
    return false;
  }

  const EC = new ec('p384');
  const verifier = EC.keyFromPublic(buf2hex(raw), 'hex');

  const obj = decodeFirstSync(doc);

  verifyInternal(verifier, obj);

  return true;
};

function buf2hex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function verifyInternal(verifier: ec.KeyPair, obj: Buffer[]) {
  if (!Array.isArray(obj)) {
    throw new Error('Expecting Array');
  }

  if (obj.length !== 4) {
    throw new Error('Expecting Array of length 4');
  }

  const p = obj[0];
  const plaintext = obj[2];
  const signer = obj[3];

  const SigStructure: Signature = ['Signature1', p, EMPTY_BUFFER, plaintext];

  doVerify(SigStructure, verifier, signer);
  return plaintext;
}

function doVerify(SigStructure: Signature, verifier: ec.KeyPair, sig: Uint8Array) {
  const ToBeSigned = encode(SigStructure);

  const hash = nodeCrypt.createHash('sha384');
  hash.update(ToBeSigned);
  const msgHash = hash.digest();

  const sigInput = { r: sig.slice(0, sig.length / 2), s: sig.slice(sig.length / 2) };
  if (!verifier.verify(msgHash, sigInput)) {
    throw new Error('Signature missmatch');
  }
}
