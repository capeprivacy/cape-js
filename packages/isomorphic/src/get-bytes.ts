import { isPlainObject } from 'is-plain-object';

type Obj = Record<string, unknown>;

export type BytesInput =
  | string
  | string[]
  | number
  | number[]
  | Buffer
  | ArrayBuffer
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | Obj
  | Obj[];

/**
 * Convert the input to a Uint8Array.
 *
 * @param encoder the TextEncoder instance to use
 */
export const getBytes =
  (encoder: TextEncoder) =>
  (input: BytesInput): Uint8Array => {
    if (input instanceof ArrayBuffer) {
      return new Uint8Array(input);
    }
    if (input instanceof Uint8Array && input.constructor.name === Uint8Array.name) {
      return input;
    }
    if (ArrayBuffer.isView(input)) {
      return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    }
    if (Array.isArray(input) || isPlainObject(input)) {
      return new Uint8Array(encoder.encode(JSON.stringify(input)));
    }
    return new Uint8Array(encoder.encode(input.toString()));
  };
