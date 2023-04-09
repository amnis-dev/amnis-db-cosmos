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
      name: 'AmnisDbCosmos',
    },
    rollupOptions: {
      output: {
        exports: 'named',
        globals: {
          '@amnis/state': 'AmnisState',
          '@azure/cosmos': 'CosmosClient',
        },
      },
      external: [
        '@amnis/state',
        '@azure/cosmos',
      ],
    },
  },
  test: {
    globals: true,
    testTimeout: 10000,
    setupFiles: ['./vitest.setup.ts'],
    singleThread: true,
    sequence: {
      setupFiles: 'list',
    },
  },
});
