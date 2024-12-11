import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { test as baseTest } from "@playwright/test";
export { expect } from "@playwright/test";

const istanbulCLIOutput = path.join(process.cwd(), "../../.nyc_output");

async function collectCoverage(coverage) {
  await fs.promises.mkdir(istanbulCLIOutput, { recursive: true });
  const filename = `playwright_coverage_${generateUUID()}.json`;
  const filepath = path.join(istanbulCLIOutput, filename);
  fs.writeFileSync(filepath, JSON.stringify(coverage));
}

export function generateUUID() {
  return crypto.randomBytes(16).toString("hex");
}

const test = baseTest.extend({
  page: async ({ page }, use) => {
    if (process.env.VITE_TEST_COVERAGE === "true") {
      await page.exposeFunction("collectCoverage", collectCoverage);

      // Listen for coverage reports coming from iframes
      page.on("load", async () => {
        await page.evaluate(async () => {
          window.addEventListener("message", async (e) => {
            if (e.data?.type === "COVERAGE_REPORT") {
              await window.collectCoverage(e.data.coverage);
            }
          });
        });
      });
    }

    await use(page);

    if (process.env.VITE_TEST_COVERAGE === "true") {
      await page.evaluate(async () => {
        // Gather coverage metrics from the parent page
        await window.collectCoverage(window.__coverage__);

        // Gather coverage metrics from any iframes that are still open
        const frames = document.querySelectorAll("iframe[data-evervault]");
        const promises = Array.from(frames).map((frame) => {
          const eventID = window.crypto
            .getRandomValues(new Uint32Array(1))
            .toString();
          return new Promise((resolve) => {
            window.addEventListener("message", async (e) => {
              if (e.data?.type === "COVERAGE_REPORT" && e.data.id === eventID) {
                await window.collectCoverage(e.data.coverage);
                resolve();
              }
            });

            frame.contentWindow.postMessage(
              { type: "GET_COVERAGE_REPORT", id: eventID },
              "*"
            );
          });
        });

        await Promise.all(promises);
      });
    }
  },
});

export { test };
