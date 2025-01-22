import { test, expect } from "@playwright/test";

test("can encrypt a card", async ({ page }) => {
  await page.goto("http://localhost:4000");
  await page.waitForFunction(() => window.Evervault);

  let values = {};

  await page.exposeFunction("handleChange", (newValues) => {
    values = newValues;
  });

  await page.evaluate(() => {
    const comp = window.evervault.ui.card();
    comp.on("change", window.handleChange);
    comp.mount("#form");
  });

  const frame = page.frameLocator("iframe[data-evervault]");
  await frame.getByLabel("Number").fill("4242424242424242");
  await frame.getByLabel("Expiration").fill("12/35");
  await frame.getByLabel("CVC").fill("123");
  await expect.poll(async () => values.card?.brand).toEqual("visa");
  const decrypted = await decrypt(values.card);
  expect(decrypted.number).toEqual("4242424242424242");
  expect(decrypted.cvc).toEqual("123");
});

async function decrypt(payload) {
  const token = btoa(
    `${process.env.VITE_EV_APP_UUID}:${process.env.EV_API_KEY}`
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
