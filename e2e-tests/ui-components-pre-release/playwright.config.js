import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

export default defineConfig({
  testDir: "./tests",
  timeout: 30 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: devices["Desktop Chrome"],
    },
  ],

  webServer: [
    {
      command:
        "pnpm --filter @repo/ui-components-pre-release-tests dev --port 4000",
      url: "http://localhost:4000",
      timeout: 120 * 1000,
      reuseExistingServer: true,
    },
  ],
});
