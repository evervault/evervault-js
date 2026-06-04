import { test, expect, VALID_CARDS } from "../utils";

// A custom brand used across tests.
// Range [88000, 88999], 16 digits, Luhn-checked, 4-digit CVC.
// Card number 8810000000000003 matches this range, is 16 digits, and passes Luhn.
const CUSTOM_BRAND_CARD = {
  number: "8810000000000003",
  month: "01",
  year: "35",
  cvc: "1234",
};

const CUSTOM_BRAND_OPTIONS = {
  numberValidationRules: {
    luhnCheck: true,
    ranges: [[88000, 88999]],
    lengths: [16],
  },
  securityCodeValidationRules: {
    lengths: [4],
  },
};

function mountWithCustomBrands(page, opts = {}, customBrandOptions = CUSTOM_BRAND_OPTIONS) {
  return page.evaluate(({opts, customBrandOptions}) => {
    const customBrand = window.evervault.brands.create("acme-card", customBrandOptions);

    const card = window.evervault.ui.card({
      ...opts,
      customBrands: [customBrand],
    });
    card.on("change", window.handleChange);
    card.mount("#form");
  }, {opts, customBrandOptions});
}

test.describe("custom brands", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4005");
    await page.waitForFunction(() => window.Evervault);
  });

  test("custom brand is detected in localBrands and not in brand", async ({
    page,
  }) => {
    let values = {};
    await page.exposeFunction("handleChange", (newValues) => {
      values = newValues;
    });

    await mountWithCustomBrands(page);

    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill(CUSTOM_BRAND_CARD.number);

    await expect
      .poll(async () => values.card?.localBrands)
      .toContain("acme-card");
    await expect.poll(async () => values.card?.brand).toBeNull();
  });

  test("custom brand card is valid with matching length, luhn, and CVC", async ({
    page,
  }) => {
    let values = {};
    await page.exposeFunction("handleChange", (newValues) => {
      values = newValues;
    });

    await mountWithCustomBrands(page);

    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill(CUSTOM_BRAND_CARD.number);
    await frame
      .getByLabel("Expiration")
      .fill(`${CUSTOM_BRAND_CARD.month}/${CUSTOM_BRAND_CARD.year}`);
    await frame.getByLabel("CVC").fill(CUSTOM_BRAND_CARD.cvc);

    await expect.poll(async () => values.isValid).toBeTruthy();
    await expect.poll(async () => values.errors).toBeNull();
  });

  test("custom brand is accepted when acceptedBrands is set", async ({
    page,
  }) => {
    let values = {};
    await page.exposeFunction("handleChange", (newValues) => {
      values = newValues;
    });

    await mountWithCustomBrands(page, { acceptedBrands: ["visa"] });

    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill(CUSTOM_BRAND_CARD.number);
    await frame.getByLabel("Number").blur();

    await expect(
      frame.getByText("This card brand is not supported")
    ).not.toBeVisible();
    await expect
      .poll(async () => values.errors?.number)
      .not.toEqual("unsupportedBrand");
  });

  test("non-custom brand is rejected when acceptedBrands is empty", async ({
    page,
  }) => {
    let values = {};
    await page.exposeFunction("handleChange", (newValues) => {
      values = newValues;
    });

    await mountWithCustomBrands(page, { acceptedBrands: [] });

    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill(VALID_CARDS.visa.number);
    await frame.getByLabel("Number").blur();

    await expect(
      frame.getByText("This card brand is not supported")
    ).toBeVisible();
    await expect
      .poll(async () => values.errors?.number)
      .toEqual("unsupportedBrand");
  });

  test("CVC validation uses custom brand CVC length rules", async ({
    page,
  }) => {
    let values = {};
    await page.exposeFunction("handleChange", (newValues) => {
      values = newValues;
    });

    await mountWithCustomBrands(page);

    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill(CUSTOM_BRAND_CARD.number);
    await frame
      .getByLabel("Expiration")
      .fill(`${CUSTOM_BRAND_CARD.month}/${CUSTOM_BRAND_CARD.year}`);

    // 3-digit CVC should be invalid for a brand requiring 4 digits
    await frame.getByLabel("CVC").fill("123");
    await frame.getByLabel("CVC").blur();
    await expect(frame.getByText("Your CVC is invalid")).toBeVisible();
    await expect.poll(async () => values.errors?.cvc).toEqual("invalid");

    // 4-digit CVC should be valid
    await frame.getByLabel("CVC").fill(CUSTOM_BRAND_CARD.cvc);
    await expect.poll(async () => values.isValid).toBeTruthy();
    await expect.poll(async () => values.errors).toBeNull();
  });

  test("CVC is truncated to the maximum allowed length for the custom brand", async ({
    page,
  }) => {
    let values = {};
    await page.exposeFunction("handleChange", (newValues) => {
      values = newValues;
    });

    await mountWithCustomBrands(page, {}, {
      ...CUSTOM_BRAND_OPTIONS,
      securityCodeValidationRules: {
        lengths: [3, 4],
      },
    });

    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill(CUSTOM_BRAND_CARD.number);
    await frame
      .getByLabel("Expiration")
      .fill(`${CUSTOM_BRAND_CARD.month}/${CUSTOM_BRAND_CARD.year}`);

    // 3-digit CVC should not be sliced
    await frame.getByLabel("CVC").fill("123");
    await frame.getByLabel("CVC").blur();
    await expect(frame.getByLabel("CVC")).toHaveValue("123");

    // 4-digit CVC should not be sliced
    await frame.getByLabel("CVC").fill("1234");
    await frame.getByLabel("CVC").blur();
    await expect(frame.getByLabel("CVC")).toHaveValue("1234");

    // >4-digit CVC should be sliced
    await frame.getByLabel("CVC").fill("1234567890");
    await frame.getByLabel("CVC").blur();
    await expect(frame.getByLabel("CVC")).toHaveValue("1234");
  });
});
