import { build } from 'esbuild';
import { join } from 'node:path';
import { commonjs } from '@hyrious/esbuild-plugin-commonjs';

const src = process.argv[2];
const out = process.argv[3];

const options = {
  bundle: true,
  color: true,
  entryPoints: [src],
  mainFields: ['main', 'module'],
  outfile: out,
  platform: 'node',
};

await Promise.all([
  build({
    ...options,
    outfile: join(out, 'index.js'),
    format: 'cjs',
  }),
  build({
    ...options,
    outfile: join(out, 'index.mjs'),
    format: 'esm',
    // Workaround to replace top level cjs imports with static import statements
    // https://github.com/evanw/esbuild/issues/2113
    plugins: [commonjs()],
  }),
]);
