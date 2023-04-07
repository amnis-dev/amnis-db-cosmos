/// <reference types="vitest" />
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'modules',
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
      },
      name: 'AmnisState',
    },
    rollupOptions: {
      output: {
        exports: 'named',
        globals: {
          '@reduxjs/toolkit': 'ReduxToolkit',
        },
      },
      external: [
        '@reduxjs/toolkit',
      ],
    },
  },
  test: {
    globals: true,
    testTimeout: 10000,
    include: [
      'src/initialize.test.ts',
      'src/create.test.ts',
      'src/read.test.ts',
    ],
    setupFiles: ['./vitest.setup.ts'],
    sequence: {
      setupFiles: 'list',
    },
  },
});
