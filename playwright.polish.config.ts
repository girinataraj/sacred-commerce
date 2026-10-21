import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['ui-polish/**/*.spec.ts', 'live-demo/**/*.spec.ts'],
  outputDir: 'docs/qa/polish/local-results',
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['json', { outputFile: 'docs/qa/polish/local-results.json' }],
    ['html', { outputFolder: 'docs/qa/polish/local-report', open: 'never' }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:3111',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium-local-polish' }],
  webServer: {
    command: 'npm run start -- --port 3111',
    url: 'http://127.0.0.1:3111',
    reuseExistingServer: process.env.POLISH_REUSE_SERVER === 'true',
    env: { SACRED_DEMO_MODE: 'true' },
  },
});
