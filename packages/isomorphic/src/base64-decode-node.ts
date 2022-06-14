export const base64Decode = (str: string): string => {
  return Buffer.from(str, 'base64').toString('utf8');
};
