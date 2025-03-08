import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globalSetup: './tests/wait-for-api.ts',
    environment: 'node',
    reporters: ['verbose'],
    testTimeout: 30000, // 30 seconds timeout for tests
    include: ['tests/**/*.test.ts', 'tests/**/*.test.js'],
    sequence: {
      // Run tests sequentially
      shuffle: false,
      concurrent: false,
    },
  },
  resolve: {
    alias: {
      'api-src': resolve(__dirname, '/app/api/src'),
      'api-config': resolve(__dirname, '/app/api/src/config'),
    },
  },
});