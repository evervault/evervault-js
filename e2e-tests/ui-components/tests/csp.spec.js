import { test, expect } from "../utils";

const ORIGIN = "http://localhost:4010";

test("built index.html loads Card under the production CSP without violations", async ({
  page,
}) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      window.__cspViolations.push(
        `${event.violatedDirective} at line ${event.lineNumber}`
      );
    });
  });

  await page.goto(
    `${ORIGIN}/index.html?component=Card&team=team_test&app=app_test&id=test`
  );
  await page.waitForFunction(() =>
    document.querySelector("link[rel=modulepreload]")
  );

  expect(await page.evaluate(() => window.__cspViolations)).toEqual([]);
  expect(errors.filter((text) => text.includes("integrity"))).toEqual([]);

  const unhashed = await page.evaluate(() =>
    [
      ...document.querySelectorAll(
        "link[rel=modulepreload]:not([integrity^=sha512-])"
      ),
    ].map((link) => link.href)
  );
  expect(unhashed).toEqual([]);
});
