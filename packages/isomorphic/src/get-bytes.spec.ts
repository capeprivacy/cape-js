import { BytesInput, getBytes } from './get-bytes';
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
    [['test'], new Uint8Array([91, 34, 116, 101, 115, 116, 34, 93]), '["test"]'],
    [[1, 2, 3], new Uint8Array([91, 49, 44, 50, 44, 51, 93]), '[1,2,3]'],
    [
      [{ foo: 'bar' }],
      new Uint8Array([91, 123, 34, 102, 111, 111, 34, 58, 34, 98, 97, 114, 34, 125, 93]),
      '[{"foo":"bar"}]',
    ],
    [{ foo: 123 }, new Uint8Array([123, 34, 102, 111, 111, 34, 58, 49, 50, 51, 125]), '{"foo":123}'],
  ])(
    'when the input is `%p`, it should return `%p`, and decode as `%s`',
    (input: BytesInput, encoded: Uint8Array, decoded: string) => {
      const bytes = getBytes(encoder)(input);
      expect(bytes).toEqual(encoded);
      expect(decoder.decode(bytes)).toBe(decoded);
    },
  );
});
