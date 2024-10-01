import { test, expect, VALID_CARDS, INVALID_CARDS } from "../utils";
import { inlineTheme } from "./customThemes";

test.describe("card component", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4005");
    await page.waitForFunction(() => window.Evervault);
  });

  Object.values(VALID_CARDS).forEach((card) => {
    test(`can capture valid card details for ${card.number} (${card.brand})`, async ({
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
      await frame.getByLabel("Number").fill(card.number);
      await frame.getByLabel("Expiration").fill(`${card.month}/${card.year}`);
      await frame.getByLabel("CVC").fill(card.cvc);
      await expect.poll(async () => values.card?.number).toBeEncrypted();
      await expect.poll(async () => values.card?.brand).toEqual(card.brand);
      await expect
        .poll(async () => values.card?.localBrands)
        .toEqual(card.localBrands);
      await expect.poll(async () => values.card?.cvc).toBeEncrypted();
      await expect
        .poll(async () => values.card?.expiry?.month)
        .toEqual(card.month);
      await expect
        .poll(async () => values.card?.expiry?.year)
        .toEqual(card.year);
      await expect.poll(async () => values.isValid).toBeTruthy();
      await expect
        .poll(async () => values.card.lastFour)
        .toEqual(card.lastFour);
      await expect.poll(async () => values.errors).toBeNull();
      await expect.poll(async () => values.card.bin).toEqual(card.bin);
      await expect.poll(async () => values.errors).toBeNull();

      const decrypted = await decrypt(values.card);
      expect(decrypted.number).toEqual(card.number);
      expect(decrypted.cvc).toEqual(card.cvc);
    });
  });

  test("shows an error message for an invalid card number", async ({
    page,
  }) => {
    let values = {};

    await page.exposeFunction("handleChange", (newValues) => {
      values = newValues;
    });

    await page.evaluate(() => {
      const card = window.evervault.ui.card();
      card.on("change", window.handleChange);
      card.mount("#form");
    });

    const testCard = INVALID_CARDS.invalidNumber;
    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill(testCard.number);
    await frame.getByLabel("Number").blur();
    await expect(frame.getByText("Your card number is invalid")).toBeVisible();
    await expect.poll(async () => values.errors.number).toEqual("invalid");
    await expect.poll(async () => values.isValid).toBeFalsy();
    await expect(
      frame.getByText("Your expiration date is invalid")
    ).not.toBeVisible();
    await expect(frame.getByText("Your CVC is invalid")).not.toBeVisible();
  });

  test("shows an error message for an unsupported card brand", async ({
    page,
  }) => {
    let values = {};

    await page.exposeFunction("handleChange", (newValues) => {
      values = newValues;
    });

    await page.evaluate(() => {
      const card = window.evervault.ui.card({ acceptedBrands: ["visa"] });
      card.on("change", window.handleChange);
      card.mount("#form");
    });

    const testCard = VALID_CARDS.amex;
    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill(testCard.number);
    await frame.getByLabel("Number").blur();
    await expect(
      frame.getByText("This card brand is not supported")
    ).toBeVisible();
    await expect
      .poll(async () => values.errors.number)
      .toEqual("unsupportedBrand");
    await expect.poll(async () => values.isValid).toBeFalsy();
    await expect(
      frame.getByText("Your expiration date is invalid")
    ).not.toBeVisible();
    await expect(frame.getByText("Your CVC is invalid")).not.toBeVisible();
  });

  test("Does not show an error message until the user has blurred away from the input", async ({
    page,
  }) => {
    await page.evaluate(() => {
      const card = window.evervault.ui.card();
      card.mount("#form");
    });

    const testCard = INVALID_CARDS.invalidNumber;
    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill(testCard.number);
    await expect(
      frame.getByText("Your card number is invalid")
    ).not.toBeVisible();
    await frame.getByLabel("Number").blur();
    await expect(frame.getByText("Your card number is invalid")).toBeVisible();
  });

  test("shows an error message for an invalid expiration date", async ({
    page,
  }) => {
    let values = {};

    await page.exposeFunction("handleChange", (newValues) => {
      values = newValues;
    });

    await page.evaluate(() => {
      const card = window.evervault.ui.card();
      card.on("change", window.handleChange);
      card.mount("#form");
    });

    const testCard = INVALID_CARDS.invalidExpiry;
    const frame = page.frameLocator("iframe[data-evervault]");
    await frame
      .getByLabel("Expiration")
      .fill(`${testCard.month}/${testCard.year}`);
    await frame.getByLabel("Expiration").blur();
    await expect(
      frame.getByText("Your expiration date is invalid")
    ).toBeVisible();
    await expect.poll(async () => values.errors.expiry).toEqual("invalid");
    await expect.poll(async () => values.isValid).toBeFalsy();
  });

  test("shows an error message for an invalid CVC", async ({ page }) => {
    let values = {};

    await page.exposeFunction("handleChange", (newValues) => {
      values = newValues;
    });

    await page.evaluate(() => {
      const card = window.evervault.ui.card();
      card.on("change", window.handleChange);
      card.mount("#form");
    });

    const testCard = INVALID_CARDS.invalidCVC;
    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("CVC").fill(testCard.cvc);
    await frame.getByLabel("CVC").blur();
    await expect(frame.getByText("Your CVC is invalid")).toBeVisible();
    await expect.poll(async () => values.errors.cvc).toEqual("invalid");
    await expect.poll(async () => values.isValid).toBeFalsy();
  });

  test("calls ready callback when ready", async ({ page }) => {
    let called = 0;
    await page.exposeFunction("handleReady", () => {
      called += 1;
    });

    await page.evaluate(() => {
      const card = window.evervault.ui.card();
      card.on("ready", window.handleReady);
      card.mount("#form");
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    await expect(frame.getByLabel("Number")).toBeVisible();
    await expect.poll(async () => called).toEqual(1);
  });

  test("can customize the component copy", async ({ page }) => {
    await page.evaluate(() => {
      const card = window.evervault.ui.card({
        translations: {
          number: {
            label: "Numéro de carte",
            errors: {
              invalid: "numéro de carte invalide",
            },
          },
          expiry: {
            label: "Date d'expiration",
            errors: {
              invalid: "Date invalide",
            },
          },
          cvc: {
            label: "Code de sécurité",
            errors: {
              invalid: "Code invalide",
            },
          },
        },
      });

      card.mount("#form");
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    const number = frame.getByLabel("Numéro de carte");
    await number.fill("4242");
    await number.blur();
    await expect(frame.getByText("numéro de carte invalide")).toBeVisible();
    const expiry = frame.getByLabel("Date d'expiration");
    await expiry.fill("01/22");
    await expiry.blur();
    await expect(frame.getByText("Date invalide")).toBeVisible();
    const cvc = frame.getByLabel("Code de sécurité");
    await cvc.fill("12");
    await cvc.blur();
    await expect(frame.getByText("Code invalide")).toBeVisible();
  });

  test("can hide CVC field", async ({ page }) => {
    await page.evaluate(() => {
      const card = window.evervault.ui.card({
        hiddenFields: ["cvc"],
      });

      card.mount("#form");
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    await expect(frame.getByLabel("Number")).toBeVisible();
    await expect(frame.getByLabel("CVC")).not.toBeVisible();
  });

  test("can hide the expiration field", async ({ page }) => {
    await page.evaluate(() => {
      const card = window.evervault.ui.card({
        hiddenFields: ["expiry"],
      });

      card.mount("#form");
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    await expect(frame.getByLabel("Number")).toBeVisible();
    await expect(frame.getByLabel("Expiration")).not.toBeVisible();
  });

  test("can manually trigger validation", async ({ page }) => {
    await page.evaluate(() => {
      const card = window.evervault.ui.card();

      card.on("ready", () => {
        card.validate();
      });

      card.mount("#form");
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    await expect(frame.getByLabel("Number")).toBeVisible();
    await expect(frame.getByText("Your card number is invalid")).toBeVisible();
  });

  test("can update config after mount", async ({ page }) => {
    await page.evaluate(() => {
      window.card = window.evervault.ui.card();
      window.card.mount("#form");
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill("424242424");
    await frame.getByLabel("Number").blur();
    await expect(frame.getByText("Your card number is invalid")).toBeVisible();

    await page.evaluate(() => {
      window.card.update({
        translations: {
          number: {
            errors: {
              invalid: "Bad card number",
            },
          },
        },
      });
    });

    await expect(frame.getByText("Bad card number")).toBeVisible();
  });

  test("allows 4 digit CVCs for Amex cards", async ({ page }) => {
    await page.evaluate(() => {
      const card = window.evervault.ui.card();
      card.mount("#form");
    });

    const visa = "4242424242424242";
    const amex = "378282246310005";
    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill(visa);
    await frame.getByLabel("CVC").fill("1234");
    await expect(frame.getByLabel("CVC")).not.toHaveValue("1234");
    await frame.getByLabel("Number").fill(amex);
    await frame.getByLabel("CVC").fill("1234");
    await expect(frame.getByLabel("CVC")).toHaveValue("1234");
  });

  test("only permits 16 digits for visa", async ({ page }) => {
    await page.evaluate(() => {
      const card = window.evervault.ui.card();
      card.mount("#form");
    });

    const visa = "4242424242424242424"; // try to input 19 digit visa
    const frame = page.frameLocator("iframe[data-evervault]");

    await frame.getByLabel("Number").fill(visa);
    await expect(frame.getByLabel("Number")).toHaveValue("4242 4242 4242 4242");
  });

  test("only permits 15 digits for amex", async ({ page }) => {
    await page.evaluate(() => {
      const card = window.evervault.ui.card();
      card.mount("#form");
    });

    const amex = "378282246310005";
    const frame = page.frameLocator("iframe[data-evervault]");

    await frame.getByLabel("Number").fill(amex);
    await expect(frame.getByLabel("Number")).toHaveValue("3782 822463 10005");
  });

  test("allows 19 digit numbers for unionpay cards", async ({ page }) => {
    await page.evaluate(() => {
      const card = window.evervault.ui.card();
      card.mount("#form");
    });

    const unionpay = "6205500000000000004";
    const frame = page.frameLocator("iframe[data-evervault]");

    await frame.getByLabel("Number").fill(unionpay);
    await expect(frame.getByLabel("Number")).toHaveValue(
      "6205 5000 0000 0000 004"
    );
  });

  test("supports card readers with track 1 mag stripes", async ({ page }) => {
    let swipeData = {};
    await page.exposeFunction("handleSwipe", (data) => {
      swipeData = data;
    });

    await page.evaluate(() => {
      const card = window.evervault.ui.card();
      card.on("swipe", window.handleSwipe);
      card.mount("#form");
    });

    const magstripe = "%B4242424242424242^DOE/JOHN A^23052200123456789?";

    const frame = page.frameLocator("iframe[data-evervault]");
    await expect(frame.getByLabel("Number")).toBeVisible();
    await frame.getByLabel("Number").pressSequentially(magstripe);
    await expect.poll(async () => swipeData?.number).toBeEncrypted();
    await expect.poll(async () => swipeData?.expiry.month).toEqual("05");
    await expect.poll(async () => swipeData?.expiry.year).toEqual("23");
    await expect.poll(async () => swipeData?.firstName).toEqual("JOHN A");
    await expect.poll(async () => swipeData?.lastName).toEqual("DOE");
    await expect.poll(async () => swipeData?.brand).toEqual("visa");
    await expect.poll(async () => swipeData?.lastFour).toEqual("4242");
    await expect.poll(async () => swipeData?.bin).toEqual("42424242");
  });

  test("supports card readers with track 2 mag stripes", async ({ page }) => {
    let swipeData = {};
    await page.exposeFunction("handleSwipe", (data) => {
      swipeData = data;
    });

    await page.evaluate(() => {
      const card = window.evervault.ui.card();
      card.on("swipe", window.handleSwipe);
      card.mount("#form");
    });

    const magstripe = ";5301250070000191=26051010912345678901?3";

    const frame = page.frameLocator("iframe[data-evervault]");
    await expect(frame.getByLabel("Number")).toBeVisible();
    await frame.getByLabel("Number").pressSequentially(magstripe);
    await expect.poll(async () => swipeData?.number).toBeEncrypted();
    await expect.poll(async () => swipeData?.expiry.month).toEqual("05");
    await expect.poll(async () => swipeData?.expiry.year).toEqual("26");
    await expect.poll(async () => swipeData?.brand).toEqual("mastercard");
    await expect.poll(async () => swipeData?.lastFour).toEqual("0191");
    await expect.poll(async () => swipeData?.bin).toEqual("53012500");
  });

  test("can be unmounted", async ({ page }) => {
    await page.evaluate(() => {
      window.card = window.evervault.ui.card();
      window.card.mount("#form");
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    await expect(frame.getByLabel("Number")).toBeVisible();

    await page.evaluate(() => {
      window.card.unmount();
    });

    await expect(frame.getByLabel("Number")).not.toBeVisible();
  });

  test("does not auto progress by default", async ({ page }) => {
    await page.evaluate(() => {
      window.card = window.evervault.ui.card();
      window.card.mount("#form");
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill("4242424242424242");
    await expect(frame.getByLabel("Expiration")).not.toBeFocused();
    await frame.getByLabel("Expiration").fill("1226");
    await expect(frame.getByLabel("CVC")).not.toBeFocused();
  });

  test("auto focuses next field when autoProgress is true", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.card = window.evervault.ui.card({ autoProgress: true });
      window.card.mount("#form");
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill("4242424242424242");
    await expect(frame.getByLabel("Expiration")).toBeFocused();
    await frame.getByLabel("Expiration").fill("1226");
    await expect(frame.getByLabel("CVC")).toBeFocused();
  });

  test("fires a validate event when validation is manually triggered", async ({
    page,
  }) => {
    let called = 0;

    await page.exposeFunction("handleValidate", () => {
      called += 1;
    });

    await page.evaluate(() => {
      const card = window.evervault.ui.card();
      card.on("validate", window.handleValidate);

      card.on("ready", () => {
        card.validate();
      });

      card.mount("#form");
    });

    await expect.poll(async () => called).toEqual(1);
  });

  test("does not fire validate event when validate method not called", async ({
    page,
  }) => {
    let called = 0;

    await page.exposeFunction("handleValidate", () => {
      called += 1;
    });

    await page.evaluate(() => {
      const card = window.evervault.ui.card();
      card.on("validate", window.handleValidate);
      card.mount("#form");
    });

    const testCard = INVALID_CARDS.invalidNumber;
    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill(testCard.number);
    await frame.getByLabel("Number").blur();
    await expect(frame.getByText("Your card number is invalid")).toBeVisible();
    await expect.poll(async () => called).toEqual(0);
  });

  test("Auto pads expiry month if value starts with a digit between 2-9", async ({
    page,
  }) => {
    await page.evaluate(() => {
      const card = window.evervault.ui.card();
      card.mount("#form");
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Expiration").fill("2");
    await expect(frame.getByLabel("Expiration")).toHaveValue("02");
  });

  ["0", "1"].forEach((digit) => {
    test(`Does not autopad expiry month if value starts with ${digit}`, async ({
      page,
    }) => {
      await page.evaluate(() => {
        const card = window.evervault.ui.card();
        card.mount("#form");
      });

      const frame = page.frameLocator("iframe[data-evervault]");
      await frame.getByLabel("Expiration").fill(digit);
      await expect(frame.getByLabel("Expiration")).toHaveValue(digit);
    });
  });

  test("Revalidates previously invalid CVC when card number changes", async ({
    page,
  }) => {
    let values = {};

    await page.exposeFunction("handleChange", (newValues) => {
      values = newValues;
    });

    await page.evaluate(() => {
      const card = window.evervault.ui.card();
      card.on("change", window.handleChange);
      card.mount("#form");
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    // enter amex card which requires 4 digit cvc
    await frame.getByLabel("Number").fill("378282246310005");
    await frame.getByLabel("CVC").fill("123");
    await frame.getByLabel("CVC").blur();
    await expect(frame.getByText("Your CVC is invalid")).toBeVisible();
    await expect.poll(async () => values.errors?.cvc).not.toBeUndefined();
    await frame.getByLabel("Number").clear();
    await frame.getByLabel("Number").fill("4242424242424242");
    await expect.poll(async () => values.errors?.cvc).toBeUndefined();
    await expect(frame.getByText("Your CVC is invalid")).not.toBeVisible();
  });

  test("Invalidates previously valid CVC when card number changes", async ({
    page,
  }) => {
    let values = {};

    await page.exposeFunction("handleChange", (newValues) => {
      values = newValues;
    });

    await page.evaluate(() => {
      const card = window.evervault.ui.card();
      card.on("change", window.handleChange);
      card.mount("#form");
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill("4242424242424242");
    await frame.getByLabel("CVC").fill("123");
    await frame.getByLabel("CVC").blur();
    await expect(frame.getByText("Your CVC is invalid")).not.toBeVisible();
    await expect.poll(async () => values.errors?.cvc).toBeUndefined();
    await frame.getByLabel("Number").clear();
    // enter amex card which requires 4 digit cvc
    await frame.getByLabel("Number").fill("378282246310005");
    await expect.poll(async () => values.errors?.cvc).not.toBeUndefined();
    await expect(frame.getByText("Your CVC is invalid")).toBeVisible();
  });

  test("Updates the underlying CVC when switching from 4 digit CVC to 3", async ({
    page,
  }) => {
    let lastChange = {};

    await page.exposeFunction("handleChange", (newValues) => {
      lastChange = newValues;
    });

    await page.evaluate(() => {
      const card = window.evervault.ui.card();
      card.on("change", window.handleChange);
      card.mount("#form");
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    // anter amex card which requires 4 digit cvc
    await frame.getByLabel("Number").fill("378282246310005");
    await frame.getByLabel("Expiration").fill("1228");
    await frame.getByLabel("CVC").fill("1234");
    await expect.poll(async () => lastChange.isComplete).toBeTruthy();
    // switch to visa card, should still be valid as CVC truncated to 123
    await frame.getByLabel("Number").clear();
    await frame.getByLabel("Number").fill("4242424242424242");
    await expect.poll(async () => lastChange.isComplete).toBeTruthy();
    // switch back to amex, should be invalid as CVC is now 3 digits
    await frame.getByLabel("Number").clear();
    await frame.getByLabel("Number").fill("378282246310005");
    await expect.poll(async () => lastChange.isComplete).toBeFalsy();
  });

  test("clean theme matches snapshot", async ({ page }) => {
    await page.evaluate(() => {
      const card = window.evervault.ui.card({
        theme: window.evervault.ui.themes.clean(),
      });

      card.mount("#form");
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill("4242424242424242");
    await frame.getByLabel("Expiration").fill("12"); // intentionally incomplete
    await frame.getByLabel("Expiration").blur();
    // delay 500ms for any animations to complete
    await page.waitForTimeout(500);
    expect(await page.screenshot()).toMatchSnapshot();
  });

  test("material theme matches snapshot", async ({ page }) => {
    await page.evaluate(() => {
      const card = window.evervault.ui.card({
        theme: window.evervault.ui.themes.material(),
      });

      card.mount("#form");
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill("4242424242424242");
    await frame.getByLabel("Expiration").fill("12"); // intentionally incomplete
    await frame.getByLabel("Expiration").blur();
    // delay 500ms for any animations to complete
    await page.waitForTimeout(500);
    expect(await page.screenshot()).toMatchSnapshot();
  });

  test("minimal theme matches snapshot", async ({ page }) => {
    await page.evaluate(() => {
      const card = window.evervault.ui.card({
        theme: window.evervault.ui.themes.minimal(),
      });

      card.mount("#form");
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill("4242424242424242");
    await frame.getByLabel("Expiration").fill("12"); // intentionally incomplete
    await frame.getByLabel("Expiration").blur();
    // delay 500ms for any animations to complete
    await page.waitForTimeout(500);
    expect(await page.screenshot()).toMatchSnapshot();
  });

  test("custom theme matches snapshot", async ({ page }) => {
    await page.evaluate((theme) => {
      const card = window.evervault.ui.card({ theme });
      card.mount("#form");
    }, inlineTheme);

    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill("4242424242424242");
    await frame.getByLabel("Expiration").fill("12"); // intentionally incomplete
    await frame.getByLabel("Expiration").blur();
    // delay 500ms for any animations to complete
    await page.waitForTimeout(500);
    expect(await page.screenshot()).toMatchSnapshot();
  });

  test("Does not render icons by default", async ({ page }) => {
    await page.evaluate(() => {
      const card = window.evervault.ui.card();
      card.mount("#form");
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill("4242424242424242");
    await expect(frame.locator("img[ev-brand='visa']")).not.toBeVisible();
  });

  test("Can render icons", async ({ page }) => {
    await page.evaluate(() => {
      const card = window.evervault.ui.card({ icons: true });
      card.mount("#form");
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill("4242424242424242");
    await expect(frame.locator("img[ev-brand='visa']")).toBeVisible();
    await frame.getByLabel("Number").fill("378282246310005");
    await expect(
      frame.locator("img[ev-brand='american-express']")
    ).toBeVisible();
  });
});

async function decrypt(payload) {
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
