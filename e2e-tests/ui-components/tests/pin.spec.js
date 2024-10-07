import { test, expect, EV_STRING_REGEX } from "../utils";

function typingDelay(min = 20, max = 100) {
  return Math.floor(Math.random() * (max - min) + min);
}

test.describe("pin component", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4005");
    await page.waitForFunction(() => window.Evervault);
  });

  test("can capture valid pin", async ({ page }) => {
    let values = {};

    await page.exposeFunction("handleChange", (newValues) => {
      values = newValues;
    });

    await page.evaluate(() => {
      const comp = window.evervault.ui.pin();
      comp.mount("#form");
      comp.on("change", window.handleChange);
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Pin character 1").focus();
    await page.keyboard.type("1", { delay: typingDelay() });
    await page.keyboard.type("2", { delay: typingDelay() });
    await page.keyboard.type("3", { delay: typingDelay() });
    await page.keyboard.type("4", { delay: typingDelay() });
    await expect.poll(async () => values.value).toMatch(EV_STRING_REGEX);
    await expect.poll(async () => values.isComplete).toBeTruthy();
  });

  test("isComplete is false when pin is not complete", async ({ page }) => {
    let values = {};

    await page.exposeFunction("handleChange", (newValues) => {
      values = newValues;
    });

    await page.evaluate(() => {
      const comp = window.evervault.ui.pin();
      comp.mount("#form");
      comp.on("change", window.handleChange);
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Pin character 1").focus();
    await page.keyboard.type("1", { delay: typingDelay() });
    await page.keyboard.type("2", { delay: typingDelay() });
    await page.keyboard.type("3", { delay: typingDelay() });
    await expect.poll(async () => values.isComplete).toBeFalsy();
    await page.keyboard.type("4", { delay: typingDelay() });
    await expect.poll(async () => values.isComplete).toBeTruthy();
  });

  test("can have a custom length", async ({ page }) => {
    let values = {};

    await page.exposeFunction("handleChange", (newValues) => {
      values = newValues;
    });

    await page.evaluate(() => {
      const comp = window.evervault.ui.pin({ length: 6 });
      comp.mount("#form");
      comp.on("change", window.handleChange);
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Pin character 6").focus();
    await page.keyboard.type("1", { delay: typingDelay() });
    await page.keyboard.type("2", { delay: typingDelay() });
    await page.keyboard.type("3", { delay: typingDelay() });
    await page.keyboard.type("4", { delay: typingDelay() });
    await page.keyboard.type("5", { delay: typingDelay() });
    await expect.poll(async () => values.isComplete).toBeFalsy();
    await page.keyboard.type("6");
    await expect.poll(async () => values.isComplete).toBeTruthy();
  });

  test("is numerical only by default", async ({ page }) => {
    let values = {};

    await page.exposeFunction("handleChange", (newValues) => {
      values = newValues;
    });

    await page.evaluate(() => {
      const comp = window.evervault.ui.pin();
      comp.mount("#form");
      comp.on("change", window.handleChange);
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    const input = frame.getByLabel("Pin character 1");
    await input.focus();
    await page.keyboard.type("A", { delay: typingDelay() });
    await page.keyboard.type("A", { delay: typingDelay() });
    await page.keyboard.type("A", { delay: typingDelay() });
    await page.keyboard.type("A", { delay: typingDelay() });
    await expect.poll(async () => values.isComplete).toBeFalsy();
    await page.keyboard.type("4", { delay: typingDelay() });
    await page.keyboard.type("3", { delay: typingDelay() });
    await page.keyboard.type("2", { delay: typingDelay() });
    await page.keyboard.type("1", { delay: typingDelay() });
    await expect.poll(async () => values.isComplete).toBeTruthy();
  });

  test("can be made alphanumerical", async ({ page }) => {
    let values = {};

    await page.exposeFunction("handleChange", (newValues) => {
      values = newValues;
    });

    await page.evaluate(() => {
      const comp = window.evervault.ui.pin({ mode: "alphanumeric" });
      comp.mount("#form");
      comp.on("change", window.handleChange);
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    const input = frame.getByLabel("Pin character 1");
    await input.focus();
    await page.keyboard.type("!", { delay: typingDelay() });
    await page.keyboard.type("@", { delay: typingDelay() });
    await page.keyboard.type("#", { delay: typingDelay() });
    await page.keyboard.type(")", { delay: typingDelay() });
    await expect.poll(async () => values.isComplete).toBeFalsy();
    await page.keyboard.type("A", { delay: typingDelay() });
    await page.keyboard.type("B", { delay: typingDelay() });
    await page.keyboard.type("C", { delay: typingDelay() });
    await page.keyboard.type("D", { delay: typingDelay() });
    await expect.poll(async () => values.isComplete).toBeTruthy();
  });

  test("configuration can be updated after mount", async ({ page }) => {
    await page.evaluate(() => {
      window.comp = window.evervault.ui.pin();
      window.comp.mount("#form");
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    await expect(frame.getByLabel("Pin character 1")).toBeVisible();
    await expect(frame.getByLabel("Pin character 6")).not.toBeVisible();

    await page.evaluate(() => {
      window.comp.update({ length: 6 });
    });

    await expect(frame.getByLabel("Pin character 6")).toBeVisible();
  });

  test("can be unmounted", async ({ page }) => {
    await page.evaluate(() => {
      window.comp = window.evervault.ui.pin();
      window.comp.mount("#form");
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    await expect(frame.getByLabel("Pin character 1")).toBeVisible();

    await page.evaluate(() => {
      window.comp.unmount();
    });

    await expect(frame.getByLabel("Pin character 1")).not.toBeVisible();
  });
});
