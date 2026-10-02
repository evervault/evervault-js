import { test, expect } from "../utils";

test.describe("card preload and show", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4005");
    await page.waitForFunction(() => window.Evervault);
  });

  test("takes up no layout space until shown", async ({ page }) => {
    await page.evaluate(async () => {
      window.card = window.evervault.ui.card();
      const ready = new Promise((resolve) => window.card.on("ready", resolve));
      window.card.preload("#form");
      await ready;
    });

    const whilePreloaded = await page.locator("#form").boundingBox();
    expect(whilePreloaded.height).toBe(0);

    await page.evaluate(() => window.card.show());

    await expect
      .poll(async () => (await page.locator("#form").boundingBox()).height)
      .toBeGreaterThan(0);
  });

  test("paints on show and stays painted", async ({ page }) => {
    await page.evaluate(async () => {
      window.card = window.evervault.ui.card();
      const ready = new Promise((resolve) => window.card.on("ready", resolve));
      window.card.preload("#form");
      await ready;
    });

    const hidden = await page.locator("body").screenshot();

    await page.evaluate(() => window.card.show());
    const shown = await page.locator("body").screenshot();

    expect(shown.equals(hidden)).toBe(false);

    await page.waitForTimeout(3000);
    const later = await page.locator("body").screenshot();

    expect(later.equals(shown)).toBe(true);
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

  test("showing without preloading throws", async ({ page }) => {
    const message = await page.evaluate(() => {
      try {
        window.evervault.ui.card().show();
        return null;
      } catch (error) {
        return error.message;
      }
    });

    expect(message).toContain("preload");
  });
});
