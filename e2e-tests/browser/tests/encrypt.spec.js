import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:4006");
  await page.waitForFunction(() => window.evervault);
});

test("can encrypt a string", async ({ page }) => {
  const result = await encryptWithSDK(page, "Hello World");
  expect(isEncryptedString(result)).toBe(true);
  const decrypted = await decryptWithAPI(result);
  expect(decrypted).toEqual("Hello World");
});

test("can encrypt a number", async ({ page }) => {
  const result = await encryptWithSDK(page, 123);
  expect(isEncryptedString(result)).toBe(true);
  const decrypted = await decryptWithAPI(result);
  expect(decrypted).toEqual(123);
});

test("can encrypt a boolean", async ({ page }) => {
  const result = await encryptWithSDK(page, true);
  expect(isEncryptedString(result)).toBe(true);
  const decrypted = await decryptWithAPI(result);
  expect(decrypted).toEqual(true);
});

test("can encrypt an object", async ({ page }) => {
  const payload = {
    name: "Dwight Schrute",
    age: 35,
    employed: true,
  };

  const result = await encryptWithSDK(page, payload);
  expect(isEncryptedString(result.name)).toBe(true);
  expect(isEncryptedString(result.age)).toBe(true);
  expect(isEncryptedString(result.employed)).toBe(true);
  const decrypted = await decryptWithAPI(result);
  expect(decrypted).toEqual(payload);
});

test("can encrypt an array", async ({ page }) => {
  const payload = ["Dwight Schrute", 35, true];

  const result = await encryptWithSDK(page, payload);
  expect(isEncryptedString(result[0])).toBe(true);
  expect(isEncryptedString(result[1])).toBe(true);
  expect(isEncryptedString(result[2])).toBe(true);
  const decrypted = await decryptWithAPI(result);
  expect(decrypted).toEqual(payload);
});

async function encryptWithSDK(page, payload) {
  let result;

  page.exposeFunction("setResult", (res) => {
    result = res;
  });

  page.evaluate((payload) => {
    window.evervault.encrypt(payload).then((res) => {
      window.setResult(res);
    });
  }, payload);

  await expect.poll(() => result).not.toBe(undefined);
  return result;
}

const ENCRYPTED_STRING_REGEX =
  /((ev(:|%3A))(debug(:|%3A))?(([A-z0-9+/=%]+)(:|%3A))?((number|boolean|string)(:|%3A))?(([A-z0-9+/=%]+)(:|%3A)){3}(\$|%24))|(((eyJ[A-z0-9+=.]+){2})([\w]{8}(-[\w]{4}){3}-[\w]{12}))/;
function isEncryptedString(str) {
  return ENCRYPTED_STRING_REGEX.test(str);
}

async function decryptWithAPI(payload) {
  const token = btoa(
    `${process.env.VITE_EV_APP_UUID}:${process.env.EV_API_KEY}`
  );

  const response = await fetch(`${process.env.VITE_API_URL}/decrypt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}
