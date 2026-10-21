import { defineConfig, devices } from '@playwright/test';

import { SESSION_FILE } from './e2e/e2e.constants';

/**
 * Browser tests of the whole app from its images: `make up` then `npm run e2e`, or the delivery
 * workflow. Nothing is mocked: they read the demo offers seeded into a real database.
 */
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  /* Every test reads and stars the same seeded offers: one at a time, so none sees another's star. */
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:8001',
    /* The reader's language, so the tests read the texts the reader reads. */
    locale: 'fr-FR',
    /* No sliding sheet or sweeping line: a moving button is never stable enough to be clicked. */
    contextOptions: { reducedMotion: 'reduce' },
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: '**/*.setup.ts' },
    {
      name: 'mobile-chromium',
      dependencies: ['setup'],
      use: { ...devices['Pixel 7'], storageState: SESSION_FILE },
    },
    {
      name: 'desktop-chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        storageState: SESSION_FILE,
      },
    },
  ],
});
