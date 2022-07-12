/**
 * Merge two or more Uint8Arrays into a single Uint8Array.
 * @param arr an array of Uint8Array's
 */
export function mergeUint8Arrays(...arr: Uint8Array[]) {
  const flat = arr.reduce<number[]>((acc, cur) => {
    acc.push(...cur);
    return acc;
  }, []);
  return new Uint8Array(flat);
}
