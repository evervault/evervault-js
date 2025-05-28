import { env } from "node:process";
import { test, expect } from "@playwright/test";
import { generateKeyPairs, memoize } from "./utils";

let keyPairs;

test.beforeAll(async () => {
  keyPairs = generateKeyPairs();
});

test.beforeEach(async ({ page }) => {
  page.addInitScript(() => {
    let testTime = Date.now();
    Date.now = () => testTime;

    crypto.getRandomValues = (buffer) => {
      console.log("intercepted random values called");
      const arr = new Array(buffer.byteLength);
      const zeroedBuf = new Uint8Array(arr);
      buffer.buffer = zeroedBuf;
    };

    const originalGenerateKey = crypto.subtle.generateKey.bind(crypto.subtle);
    function memoize(fn) {
      const invocationMap = {};
      return (...args) => {
        console.log("memoized function entered");
        const serializedArgs = JSON.stringify(args);
        if (invocationMap[serializedArgs] != null) {
          console.log("returning memoized invocation");
          return invocationMap[serializedArgs];
        }
        const invocation = fn(...args);
        invocationMap[serializedArgs] = invocation;
        console.log("tracking invocation");
        return invocation;
      };
    }

    crypto.subtle.generateKey = memoize(originalGenerateKey);
  });

  await page.route(`${env.VITE_KEYS_URL}/*/apps/*?*`, (route) => {
    const reqUrl = route.request().url();
    const path = reqUrl.slice(env.VITE_KEYS_URL.length);
    const [_leadingSlash, teamUuid, _apps, appUuid] = path.split("/");
    return route.fulfill({
      status: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        appUuid,
        teamUuid,
        ...keyPairs.publicKeys,
      }),
    });
  });
  await page.goto("http://localhost:4009");
  await page.waitForFunction(() => window.evervault);
  await page.waitForFunction(() => window.encryption);
});

test("Always pass", async ({ page }) => {
  let result;
  page.exposeFunction("setResult", (res) => {
    result = res;
  });

  const plaintextValue = "plaintext";
  page.evaluate((payload) => {
    window.evervault.encrypt(payload).then((res) => {
      window.setResult(res);
    });
  }, plaintextValue);

  await expect.poll(() => result).not.toBe(undefined);

  const browserEncryptedValue = result;
  page.evaluate(() => {
    window.setResult(undefined);
  });
  await expect.poll(() => result).toBe(undefined);

  page.evaluate((payload) => {
    window.encryption.encrypt(payload).then((res) => {
      window.setResult(res);
    });
  }, plaintextValue);
  await expect.poll(() => result).not.toBe(undefined);
  await expect.poll(() => result).toEqual(browserEncryptedValue);
});
