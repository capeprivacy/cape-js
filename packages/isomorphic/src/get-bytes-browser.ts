const encoder = new TextEncoder();

export const getBytes = (str: string) => {
  return new Uint8Array(encoder.encode(str));
};
