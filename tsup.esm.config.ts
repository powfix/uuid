import { defineConfig } from 'tsup';
import packageJson from './package.json';

const dependencies = Object.keys(packageJson.dependencies || {});
const devDependencies = Object.keys(packageJson.devDependencies || {});
const peerDependencies = Object.keys(packageJson.peerDependencies || {});

export default defineConfig({
  entry: ['src/**/*.ts'],
  splitting: true,
  target: 'es5',
  format: 'esm',
  dts: true,
  treeshake: true,
  bundle: false,

  // entry: ['src/index.ts', 'src/index.node.ts'],
  // format: ['esm', 'cjs'],
  // dts: true,
  // clean: true,
  // splitting: false,
  // sourcemap: false,
  // minify: false,
  // external: [
  //   ...dependencies,
  //   ...devDependencies,
  //   ...peerDependencies,
  // ],
});
