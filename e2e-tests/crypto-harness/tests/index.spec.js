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
  const plaintextValue = "plaintext";
  const browserEncryptedValue = await page.evaluate(async (payload) => {
    return await window.evervault.encrypt(payload);
  }, plaintextValue);

  const encryptionEncryptedValue = await page.evaluate(async (payload) => {
    return await window.encryption.encrypt(payload);
  }, plaintextValue);

  expect(encryptionEncryptedValue).toEqual(browserEncryptedValue);
});

test("Assert that both libraries produce equivalent ciphertexts for numbers", async ({
  page,
}) => {
  const plaintextValue = 1234;
  const browserEncryptedValue = await page.evaluate(async (payload) => {
    return await window.evervault.encrypt(payload);
  }, plaintextValue);

  const encryptionEncryptedValue = await page.evaluate(async (payload) => {
    return await window.encryption.encrypt(payload);
  }, plaintextValue);

  expect(encryptionEncryptedValue).toEqual(browserEncryptedValue);
});

test("Assert that both libraries produce equivalent ciphertexts for booleans", async ({
  page,
}) => {
  const plaintextValue = true;
  const browserEncryptedValue = await page.evaluate(async (payload) => {
    return await window.evervault.encrypt(payload);
  }, plaintextValue);

  const encryptionEncryptedValue = await page.evaluate(async (payload) => {
    return await window.encryption.encrypt(payload);
  }, plaintextValue);

  expect(encryptionEncryptedValue).toEqual(browserEncryptedValue);
});

test("Assert that both libraries correctly traverse objects, resulting in consistent ciphers", async ({
  page,
}) => {
  const plaintextValue = {
    stringVal: "plaintext12345",
    numberVal: 9999,
    booleanVal: false,
  };
  const browserEncryptedValue = await page.evaluate(async (payload) => {
    return await window.evervault.encrypt(payload);
  }, plaintextValue);

  const encryptionEncryptedValue = await page.evaluate(async (payload) => {
    return await window.encryption.encrypt(payload);
  }, plaintextValue);

  expect(encryptionEncryptedValue.stringVal).toEqual(
    browserEncryptedValue.stringVal
  );
  expect(encryptionEncryptedValue.numberVal).toEqual(
    browserEncryptedValue.numberVal
  );
  expect(encryptionEncryptedValue.booleanVal).toEqual(
    browserEncryptedValue.booleanVal
  );
});
