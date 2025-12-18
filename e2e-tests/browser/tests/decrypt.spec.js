import { test, expect } from "../utils";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:4006");
  await page.waitForFunction(() => window.evervault);
});

test("can decrypt with a client decrypt token", async ({ page }) => {
  const payload = "Dwight Schrute";
  const { token } = await createClientDecryptToken(payload);

  const result = await page.evaluate(
    async ([token, payload]) => {
      return await window.evervault.decrypt(token, payload);
    },
    [token, payload]
  );

  expect(result).toEqual(payload);
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
