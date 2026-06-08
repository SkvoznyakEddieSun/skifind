import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 390, height: 844 }, // iPhone 14 size
    video: 'on',
    screenshot: 'on',
    deviceScaleFactor: 2,
    channel: 'chrome', // use system Chrome instead of downloading Playwright Chromium
  },
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
  },
});
