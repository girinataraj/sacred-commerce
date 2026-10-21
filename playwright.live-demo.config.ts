import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/live-demo',
  outputDir: 'docs/qa/live-evidence/test-results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: [
    ['list'],
    ['json', { outputFile: 'docs/qa/live-evidence/results.json' }],
    ['html', { outputFolder: 'docs/qa/live-evidence/html', open: 'never' }],
  ],
  use: {
    baseURL: process.env.SACRED_LIVE_URL ?? 'http://127.0.0.1:3111',
    ...devices['Desktop Chrome'],
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium-live-demo', use: { ...devices['Desktop Chrome'] } }],
});
