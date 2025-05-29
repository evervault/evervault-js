import { env } from "node:process";
import { test, expect } from "@playwright/test";
import { generateKeyPairs } from "./utils";

let keyPairs;

test.beforeAll(async () => {
  keyPairs = generateKeyPairs();
});

test.beforeEach(async ({ page }) => {
  page.addInitScript(() => {
    let testTime = Date.now();
    Date.now = () => testTime;

    crypto.getRandomValues = (buffer) => {
      const arr = new Array(buffer.byteLength);
      const zeroedBuf = new Uint8Array(arr);
      buffer.buffer = zeroedBuf;
    };

    const originalGenerateKey = crypto.subtle.generateKey.bind(crypto.subtle);
    function memoize(fn) {
      const invocationMap = {};
      return (...args) => {
        const serializedArgs = JSON.stringify(args);
        if (invocationMap[serializedArgs] != null) {
          return invocationMap[serializedArgs];
        }
        const invocation = fn(...args);
        invocationMap[serializedArgs] = invocation;
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

test("Assert that both libraries produce equivalent ciphertexts for strings", async ({
  page,
}) => {
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

test("Assert that both libraries produce equivalent ciphertexts for numbers", async ({
  page,
}) => {
  let result;
  page.exposeFunction("setResult", (res) => {
    result = res;
  });

  const plaintextValue = 1234;
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

test("Assert that both libraries produce equivalent ciphertexts for booleans", async ({
  page,
}) => {
  let result;
  page.exposeFunction("setResult", (res) => {
    result = res;
  });

  const plaintextValue = true;
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

test("Assert that both libraries correctly traverse objects, resulting in consistent ciphers", async ({
  page,
}) => {
  let result;
  page.exposeFunction("setResult", (res) => {
    result = res;
  });

  const plaintextValue = {
    stringVal: "plaintext12345",
    numberVal: 9999,
    booleanVal: false,
  };
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
  await expect
    .poll(() => result.stringVal)
    .toEqual(browserEncryptedValue.stringVal);
  await expect
    .poll(() => result.numberVal)
    .toEqual(browserEncryptedValue.numberVal);
  await expect
    .poll(() => result.booleanVal)
    .toEqual(browserEncryptedValue.booleanVal);
});
