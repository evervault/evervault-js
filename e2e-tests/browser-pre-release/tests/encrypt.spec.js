import { test, expect } from "@playwright/test";

test("can encrypt a string", async ({ page }) => {
  await page.goto("http://localhost:4000");
  await page.waitForFunction(() => window.Evervault);

  let result = null;

  await page.exposeFunction("setResult", (data) => {
    result = data;
  });

  await page.evaluate(async () => {
    const encrypted = await window.evervault.encrypt("hello world");
    document.body.append(encrypted);
    window.setResult(encrypted);
  });

  const decrypted = await decrypt(result);
  expect(decrypted).toEqual("hello world");
});

async function decrypt(payload) {
  const token = btoa(
    `${process.env.VITE_EV_APP_UUID}:${process.env.VITE_API_KEY}`
  );

  try {
    const response = await fetch(`https://api.evervault.com/decrypt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${token}`,
      },
      body: JSON.stringify(payload),
    });

    return response.json();
  } catch (e) {
    console.log("decrypt error");
    console.error(e);
  }
}
