import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
  resolve: {
    alias: {
      '@phoenixlabs/form-engine': path.resolve(
        __dirname,
        '../../packages/form-engine/src/index.ts',
      ),
    },
  },
});
