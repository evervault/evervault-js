import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 30 * 1000,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Use 3 of 4 cores in CI. */
  workers: process.env.CI ? "100%" : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: devices["Desktop Chrome"],
    },
    {
      name: "firefox",
      use: devices["Desktop Firefox"],
    },
    {
      name: "webkit",
      use: devices["Desktop Safari"],
    },
    {
      name: "iPhone 12",
      use: devices["iPhone 12"],
    },
    {
      name: "Pixel 7",
      use: devices["Pixel 7"],
    },
  ],

  webServer: [
    {
      command: "pnpm --filter=@evervault/browser dev:preview",
      url: "http://localhost:4002/evervault-browser.main.umd.cjs",
      timeout: 20 * 3000,
    },
    {
      command: "pnpm --filter @evervault/ui-components dev --port 4001",
      url: "http://localhost:4001",
      timeout: 20 * 3000,
    },
    {
      command: "pnpm --filter @repo/e2e-tests-ui-components-vanilla-server dev",
      url: "http://localhost:4005",
      timeout: 20 * 3000,
    },
  ],
});
