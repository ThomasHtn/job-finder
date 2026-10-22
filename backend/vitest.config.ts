import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html'],
      include: ['src/**/*.ts'],
      /* Generated client, entry points, Nest wiring and test helpers hold no logic worth a floor. */
      exclude: [
        'src/generated/**',
        'src/main.ts',
        'src/test-setup.ts',
        'src/cli/**',
        'src/**/*.module.ts',
        'src/**/*.fixtures.ts',
        'src/**/*.spec.ts',
      ],
      /* Floors only ever go up: raise them when coverage grows, never lower them. */
      thresholds: {
        statements: 96,
        branches: 90,
        functions: 93,
        lines: 96,
      },
    },
  },
});
