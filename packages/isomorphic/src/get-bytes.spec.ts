import { getBytes } from './get-bytes';
import { TextDecoder, TextEncoder } from 'util';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

describe('getBytes', () => {
  it.each([
    [123, new Uint8Array([49, 50, 51]), '123'],
    ['test', new Uint8Array([116, 101, 115, 116]), 'test'],
    [Buffer.from('abc'), new Uint8Array([97, 98, 99]), 'abc'],
    [new Uint8Array([116, 101, 115, 116]), new Uint8Array([116, 101, 115, 116]), 'test'],
    [new Uint16Array([5]), new Uint8Array([5, 0]), ' '],
    [new Uint32Array([2]), new Uint8Array([2, 0, 0, 0]), '   '],
    [new ArrayBuffer(10), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), '          '],
  ])('when the input is `%p`, it should return `%p`, and decode as `%s`', (input, encoded, decoded) => {
    const bytes = getBytes(encoder)(input);
    expect(bytes).toEqual(encoded);
    expect(decoder.decode(bytes)).toBe(decoded);
  });
});
