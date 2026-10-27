import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { join } from 'node:path';

// `vite build --mode single` emits one self-contained dist/index.html that works offline (file://).
export default defineConfig(({ mode }) => ({
  // Relative URLs let one build run at a site root or under a GitHub Pages path such as /<repo>/.
  base: './',
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
