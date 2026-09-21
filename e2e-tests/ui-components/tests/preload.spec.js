import { test, expect } from "../utils";

test.describe("card preload and reveal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4005");
    await page.waitForFunction(() => window.Evervault);
  });

  test("takes up no layout space until revealed", async ({ page }) => {
    await page.evaluate(async () => {
      window.card = window.evervault.ui.card();
      const ready = new Promise((resolve) => window.card.on("ready", resolve));
      window.card.preload("#form");
      await ready;
    });

    const whilePreloaded = await page.locator("#form").boundingBox();
    expect(whilePreloaded.height).toBe(0);

    await page.evaluate(() => window.card.reveal());

    await expect
      .poll(async () => (await page.locator("#form").boundingBox()).height)
      .toBeGreaterThan(0);
  });

  test("paints on reveal and stays painted", async ({ page }) => {
    await page.evaluate(async () => {
      window.card = window.evervault.ui.card();
      const ready = new Promise((resolve) => window.card.on("ready", resolve));
      window.card.preload("#form");
      await ready;
    });

    const hidden = await page.locator("body").screenshot();

    await page.evaluate(() => window.card.reveal());
    const revealed = await page.locator("body").screenshot();

    expect(revealed.equals(hidden)).toBe(false);

    await page.waitForTimeout(3000);
    const later = await page.locator("body").screenshot();

    expect(later.equals(revealed)).toBe(true);
  });

  test("mounting a preloaded card throws", async ({ page }) => {
    const message = await page.evaluate(async () => {
      window.card = window.evervault.ui.card();
      const ready = new Promise((resolve) => window.card.on("ready", resolve));
      window.card.preload("#form");
      await ready;

      try {
        window.card.mount("#form");
        return null;
      } catch (error) {
        return error.message;
      }
    });

    expect(message).toContain("already mounted");
  });

  test("revealing without preloading throws", async ({ page }) => {
    const message = await page.evaluate(() => {
      try {
        window.evervault.ui.card().reveal();
        return null;
      } catch (error) {
        return error.message;
      }
    });

    expect(message).toContain("preload");
  });
});
