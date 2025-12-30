/**
 * Minimal Playwright config for a single smoke E2E test of dev pages.
 * Run headed to "see it": `npx playwright test --headed`
 */
export default {
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:4000",
  },
  webServer: {
    command: "npm run server",
    url: "http://localhost:4000/slideshow",
    reuseExistingServer: true,
    timeout: 30_000,
  },
};
