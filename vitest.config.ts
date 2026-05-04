import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    globalSetup: 'src/tests/global-setup.ts',
    setupFiles: 'src/tests/setup.ts',
    fileParallelism: false,
    env: {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5433/racional',
      NODE_ENV: 'test',
    },
  },
});
