/**
 * Decode a base64 encoded string.
 *
 * @param str - The base64 encoded string.
 * @returns The decoded string.
 */
export const base64Decode = (str: string): string => {
  return Buffer.from(str, 'base64').toString('utf8');
};
