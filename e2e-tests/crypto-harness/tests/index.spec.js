import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:4009");
  await page.waitForFunction(() => window.evervault);
  await page.waitForFunction(() => window.encryption);
});

test('Always pass', async ({ page }) => {
  let result;
  page.exposeFunction("setResult", (res) => {
    result = res;
  });

  page.evaluate((payload) => {
    window.evervault.encrypt(payload).then((res) => {
      window.setResult(res);
    });
  }, 'evervault');
  
  await expect.poll(() => result).not.toBe(undefined);

  page.evaluate(() => {
    window.setResult(undefined);
  });
  await expect.poll(() => result).toBe(undefined);

  page.evaluate((payload) => {
    window.encryption.encrypt(payload).then((res) => {
      window.setResult(res);
    });
  }, 'evervault');
  await expect.poll(() => result).not.toBe(undefined);
});