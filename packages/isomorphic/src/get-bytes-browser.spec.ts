import { getBytes } from './get-bytes-browser';

describe('getBytes.browser', () => {
  it('should return a Uint8Array', () => {
    const bytes = getBytes('test');
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes).toEqual(new Uint8Array([116, 101, 115, 116]));
  });
});
