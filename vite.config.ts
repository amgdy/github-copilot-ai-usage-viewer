import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const packageVersion: string = JSON.parse(readFileSync(join(import.meta.dirname, 'package.json'), 'utf8')).version;

// GitHub Actions sets these for every run. A build on a computer has none of them and shows "local build".
const buildInfo = {
  version: packageVersion,
  runNumber: process.env.GITHUB_RUN_NUMBER,
  runAttempt: process.env.GITHUB_RUN_ATTEMPT,
  runId: process.env.GITHUB_RUN_ID,
  commit: process.env.GITHUB_SHA,
  repository: process.env.GITHUB_REPOSITORY,
  serverUrl: process.env.GITHUB_SERVER_URL,
  builtAt: process.env.GITHUB_RUN_ID ? new Date().toISOString() : undefined,
};

// `vite build --mode single` emits one self-contained dist/index.html that works offline (file://).
export default defineConfig(({ mode }) => ({
  // Relative URLs let one build run at a site root or under a GitHub Pages path such as /<repo>/.
  base: './',
  define: { __BUILD_INFO__: JSON.stringify(buildInfo) },
  plugins: [react(), tailwindcss(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  resolve: {
    alias: { '@': join(import.meta.dirname, 'src') },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2500,
  },
  worker: { format: 'es' },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Glob-based guards must see dictionaries added since the previous test run.
    fsModuleCache: false,
    // Node 26 turns on Web Storage. Without a storage file, every test run prints a warning.
    // Turning it off keeps localStorage undefined in tests, the same as in Node 24.
    execArgv: ['--no-experimental-webstorage'],
  },
}));
