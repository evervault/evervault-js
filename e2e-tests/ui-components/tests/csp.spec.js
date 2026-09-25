import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { test, expect } from "../utils";

const DIST = resolve(__dirname, "../../../packages/ui-components/dist");

const PRODUCTION_CSP =
  "default-src 'self'; script-src 'self' *.evervault.com fonts.googleapis.com fonts.gstatic.com https://pay.google.com/gp/p/js/pay.js https://applepay.cdn-apple.com; connect-src 'self' *.evervault.com *.relay.evervault.app 3ds-trampoline.evervault.app fonts.googleapis.com fonts.gstatic.com https://google.com/pay https://www.google.com/pay https://pay.google.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com fonts.gstatic.com https://google.com/pay; font-src fonts.gstatic.com; img-src data: https://www.gstatic.com; frame-src *;";

const CONTENT_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
};

let server;
let origin;

test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const path = new URL(req.url, "http://localhost").pathname;
    const file = path === "/" ? "index.html" : path.slice(1);
    try {
      const body = await readFile(resolve(DIST, file));
      res.writeHead(200, {
        "Content-Type":
          CONTENT_TYPES[extname(file)] ?? "application/octet-stream",
        "Content-Security-Policy": PRODUCTION_CSP,
      });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((done) => server.listen(0, done));
  origin = `http://localhost:${server.address().port}`;
});

test.afterAll(async () => {
  await new Promise((done) => server.close(done));
});

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
      `${origin}/index.html?component=Card&team=team_test&app=app_test&id=test`
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
