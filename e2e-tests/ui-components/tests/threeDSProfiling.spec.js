import { test, expect } from "../utils";

test.describe("3DS profiling", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4005");
    await page.waitForFunction(() => window.Evervault);
  });

  test("the Card gives no profiling ID without the option", async ({
    page,
  }) => {
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
    await frame.getByLabel("Number").fill("5555550130659057");
    await frame.getByLabel("Expiration").fill("01/35");
    await frame.getByLabel("CVC").fill("123");
    await expect.poll(async () => values.isValid).toBeTruthy();
    expect(values.threeDSProfilingId).toBeNull();
  });
});
