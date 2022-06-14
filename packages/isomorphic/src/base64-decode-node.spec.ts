import { base64Decode } from './base64-decode-node';

describe('base64Decode.node', () => {
  it('should return a string', () => {
    const str = base64Decode('dGVzdA==');
    expect(str).toBe('test');
  });
});
