import { defineConfig, devices } from "@playwright/test";

/**
 * CORE tests — run against a DEPLOYED environment (not a local server; that's
 * tests/e2e + playwright.config.ts). This is the post-deploy gate.
 *
 * Target URL comes from CORE_BASE_URL (defaults to staging). Login uses a
 * dedicated test account: TEST_USER_EMAIL / TEST_USER_PASSWORD (CI secrets, or
 * your shell locally).
 *
 * Run:  pnpm test:core
 *       CORE_BASE_URL=https://boatstead.sharukrules.workers.dev pnpm test:core
 */
const baseURL = process.env.CORE_BASE_URL ?? "https://boatstead-staging.sharukrules.workers.dev";

export default defineConfig({
  testDir: "./tests/core",
  outputDir: ".artifacts/playwright/core-results",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: 2,
  reporter: "line",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  // No webServer — hits the deployed baseURL directly.
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
