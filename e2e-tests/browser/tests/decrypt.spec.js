import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:4005");
  await page.waitForFunction(() => window.evervault);
});

test("can decrypt with a client decrypt token", async ({ page }) => {
  const payload = "Dwight Schrute";
  const { token } = await createClientDecryptToken(payload);

  let result;

  page.exposeFunction("setResult", (res) => {
    result = res;
  });

  page.evaluate(
    ([token, payload]) => {
      window.evervault.decrypt(token, payload).then((res) => {
        window.setResult(res);
      });
    },
    [token, payload]
  );

  await page.waitForTimeout(10000);
  await expect.poll(() => result).toEqual(payload);
});

async function createClientDecryptToken(payload) {
  const token = btoa(
    `${process.env.VITE_EV_APP_UUID}:${process.env.EV_API_KEY}`
  );

  const response = await fetch(
    `${process.env.VITE_API_URL}/client-side-tokens`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${token}`,
      },
      body: JSON.stringify({
        action: "api:decrypt",
        payload,
      }),
    }
  );

  return response.json();
}
