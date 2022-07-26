import { build } from 'esbuild';

const src = process.argv[2];
const out = process.argv[3];

await build({
  bundle: true,
  entryPoints: [src],
  format: 'cjs',
  outfile: out,
  platform: 'node',
});
