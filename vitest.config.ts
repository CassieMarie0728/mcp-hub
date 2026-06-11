import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['lib/__tests__/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: [...configDefaults.exclude, '__tests__/**', '**/__fixtures__/**'],
  },
});
