import crypto from 'crypto';

// Hacks to get Tink working without the browser.

if (typeof globalThis.self === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis.self = global;
}

if (typeof globalThis.self.crypto === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis.self.crypto = crypto.webcrypto;
}

if (typeof globalThis.window === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - we already know this is bad, look for a long term fix
  globalThis.window = globalThis;
}

if (typeof globalThis.btoa === 'undefined') {
  globalThis.btoa = function (str: string) {
    return Buffer.from(str).toString('base64');
  };
}
