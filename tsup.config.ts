import {defineConfig} from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/index.node.ts'],
  splitting: true,
  target: 'es2020',
  format: ['cjs', 'esm'],
  dts: false,
  treeshake: true,
  bundle: true,
});
