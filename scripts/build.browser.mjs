import { build } from 'esbuild';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { join } from 'node:path';

const src = process.argv[2];
const out = process.argv[3];

const options = {
  bundle: true,
  entryPoints: [src],
  format: 'esm',
  platform: 'browser',
  plugins: [
    NodeModulesPolyfillPlugin(),
    NodeGlobalsPolyfillPlugin({
      buffer: true,
      crypto: false, // Depend on WebCrypto API instead of a polyfill
      url: false,
    }),
  ],
  target: ['chrome90', 'firefox90', 'safari11'],
};

await Promise.all([
  build({
    ...options,
    format: 'esm',
    outfile: join(out, 'browser.esm.js'),
  }),
  build({
    ...options,
    format: 'cjs',
    outfile: join(out, 'browser.cjs.js'),
  }),
]);
