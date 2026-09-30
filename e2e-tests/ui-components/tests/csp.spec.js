import { test, expect } from "../utils";

const ORIGIN = "http://localhost:4010";

test.describe("built index.html under the production CSP", () => {
  test("loads Card without CSP violations or blocked resources", async ({
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
        if (event.blockedURI.endsWith("/favicon.ico")) return;
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

    const violations = await page.evaluate(() => window.__cspViolations);
    expect(violations).toEqual([]);
    expect(
      errors.filter(
        (text) =>
          text.includes("Content Security Policy") || text.includes("integrity")
      )
    ).toEqual([]);

    const preloads = await page.evaluate(() =>
      [...document.querySelectorAll("link[rel=modulepreload]")].map((link) => ({
        href: link.getAttribute("href"),
        integrity: link.getAttribute("integrity"),
      }))
    );
    expect(preloads.length).toBeGreaterThan(0);
    for (const preload of preloads) {
      expect(preload.integrity, preload.href).toMatch(/^sha512-/);
    }
  });
});
