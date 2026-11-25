/**
 * Minimal Playwright config for a single smoke E2E test of dev pages.
 * Run headed to "see it": `npx playwright test --headed`
 */
export default {
  testDir: "./e2e",
  timeout: 30_000,
  // CI-only guards: a stray `test.only` fails the run instead of silently
  // skipping the rest, and a flaky test gets retried with a trace to upload.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://localhost:4000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run start",
    url: "http://localhost:4000/slideshow",
    reuseExistingServer: true,
    timeout: 30_000,
  },
};
