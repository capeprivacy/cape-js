import { mergeUint8Arrays } from './merge-uint8-arrays';

describe('mergeUint8Arrays', function () {
  test('returns a single Uint8Array', () => {
    const value = new Uint8Array([1, 2, 3]);
    expect(mergeUint8Arrays(value)).toEqual(value);
  });

  test('merges two or more Uint8Arrays', () => {
    expect(mergeUint8Arrays(new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6]))).toEqual(
      new Uint8Array([1, 2, 3, 4, 5, 6]),
    );
    expect(mergeUint8Arrays(new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6]), new Uint8Array([7, 8]))).toEqual(
      new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
    );
  });
});
