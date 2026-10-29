import { defineConfig, devices } from '@playwright/test';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 3,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.TEST_BASE_URL ?? 'http://127.0.0.1:4321',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    ...(process.env.PLAYWRIGHT_ALL_BROWSERS
      ? [{ name: 'mobile-webkit', use: { ...devices['iPhone 13'] } }]
      : []),
  ],
  webServer: process.env.TEST_BASE_URL
    ? undefined
    : {
        command: 'npm run preview',
        url: 'http://127.0.0.1:4321',
        reuseExistingServer: !process.env.CI,
      },
});
