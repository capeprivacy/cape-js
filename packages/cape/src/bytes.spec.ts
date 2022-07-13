import { concat } from './bytes';

describe('bytes', () => {
  describe('concat', function () {
    test('returns a single Uint8Array', () => {
      const value = new Uint8Array([1, 2, 3]);
      expect(concat(value)).toEqual(value);
    });

    test('merges two or more Uint8Arrays', () => {
      expect(concat(new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6]))).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]));
      expect(concat(new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6]), new Uint8Array([7, 8]))).toEqual(
        new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
      );
    });
  });
});
