import crypto from 'crypto';

// Hack to get the global crypto object in Node to work with Tink. Tink depends on the browsers window.crypto object,
// so we must add it to the global object.
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

if (typeof window === 'undefined') {
  globalThis.window = globalThis;
}

if (typeof globalThis.btoa === 'undefined') {
  globalThis.btoa = function (str: string) {
    return Buffer.from(str).toString('base64');
  };
}
