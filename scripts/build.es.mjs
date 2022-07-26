import { build } from 'esbuild';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

const src = process.argv[2];
const out = process.argv[3];

await build({
  bundle: true,
  entryPoints: [src],
  format: 'esm',
  outfile: out,
  platform: 'browser',
  plugins: [
    NodeModulesPolyfillPlugin(),
    NodeGlobalsPolyfillPlugin({
      buffer: true,
      crypto: false, // Depend on WebCrypto API instead of a polyfill
    }),
  ],
  target: ['chrome90', 'firefox90', 'safari11'],
});
