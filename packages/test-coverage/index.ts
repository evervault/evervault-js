import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import {
  PlaywrightTestArgs,
  PlaywrightWorkerArgs,
  TestType,
} from "@playwright/test";

type CoverageMetrics = Object;

declare global {
  interface Window {
    collectCoverage: (coverage: any) => Promise<void>;
    __coverage__: CoverageMetrics;
  }
}

const istanbulCLIOutput = path.join(__dirname, "../../.nyc_output");

async function collectCoverage(coverage: CoverageMetrics) {
  if (!coverage) return;
  await fs.promises.mkdir(istanbulCLIOutput, { recursive: true });
  const filename = `playwright_coverage_${generateUUID()}.json`;
  const filepath = path.join(istanbulCLIOutput, filename);
  fs.writeFileSync(filepath, JSON.stringify(coverage));
}

export function generateUUID() {
  return crypto.randomBytes(16).toString("hex");
}

// extends playwrights test function with a custom page fixture to collect coverage
// metrics from both the playwright frame as well as any ui-component iframes that
// are opened during the test.
export function extendTest(
  test: TestType<PlaywrightTestArgs, PlaywrightWorkerArgs>
) {
  return test.extend({
    page: async ({ page }, use) => {
      if (process.env.VITE_TEST_COVERAGE === "true") {
        // Expose the collectCoverage function to the page
        await page.exposeFunction("collectCoverage", collectCoverage);

        // on page load setup a listener for coverage reports coming from
        // UI Component iframes being closed
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

      // run test
      await use(page);

      if (process.env.VITE_TEST_COVERAGE === "true") {
        await page.evaluate(async () => {
          // Gather coverage metrics from the parent page
          await window.collectCoverage(window.__coverage__);

          // Gather coverage metrics from any iframes that are still open
          const frames = document.querySelectorAll(
            "iframe[data-evervault]"
          ) as NodeListOf<HTMLIFrameElement>;

          const promises = Array.from(frames).map((frame) => {
            const eventID = window.crypto
              .getRandomValues(new Uint32Array(1))
              .toString();

            return new Promise((resolve) => {
              window.addEventListener("message", async (e) => {
                if (
                  e.data?.type === "COVERAGE_REPORT" &&
                  e.data.id === eventID
                ) {
                  await window.collectCoverage(e.data.coverage);
                  resolve(true);
                }
              });

              frame.contentWindow?.postMessage(
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
}
