/**
 * Concat two or more Uint8Arrays into a single Uint8Array.
 * @param arr an array of Uint8Array's
 */
export function concat(...arrays: Uint8Array[]) {
  let len = 0;
  for (const arr of arrays) {
      len += arr.length;
  }
  const result = new Uint8Array(len);
  let offset = 0;
  for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
  }
  return result;
}
