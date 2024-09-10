import { test, expect } from "@playwright/test";
import { CardLib } from "../utils.js";

const appUuid = process.env.VITE_EV_APP_UUID
const teamUuid = process.env.VITE_EV_TEAM_UUID

test.describe("evervault inputs", () => {
  test.describe("v2 render default inputs", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(
        `http://localhost:4173/v2/?team=${teamUuid}&app=${appUuid}`
      );
    });

    test("renders inputs with CVV", async ({ page }) => {
      await expect(page.getByLabel("Card number")).toBeVisible();
      await expect(page.getByLabel("Expiration date")).toBeVisible();
      await expect(page.getByLabel("Security code")).toBeVisible();
    });

    test("does not show errors for correct fields", async ({ page }) => {
      await page.getByLabel("Card number").fill(CardLib.validCardNumber);
      await page.getByLabel("Card number").press("Enter");
      await page
        .getByLabel("Expiration date")
        .fill(CardLib.validExpirationData);
      await page.getByLabel("Expiration date").press("Enter");
      await page.getByLabel("Security code").fill(CardLib.validSecurityCode);
      await page.getByLabel("Security code").press("Enter");

      await expect(
        page.getByText("Your card number is invalid")
      ).not.toBeVisible();
    });

    // Special test case as Amex cards CVV is 4 digits
    test("does not show errors for correct fields and amex card", async ({
      page,
    }) => {
      await page.getByLabel("Card number").fill(CardLib.validAmexCard);
      await page.getByLabel("Card number").press("Enter");
      await page
        .getByLabel("Expiration date")
        .fill(CardLib.validExpirationData);
      await page.getByLabel("Expiration date").press("Enter");
      await page.getByLabel("Security code").fill(CardLib.validAmexCVV);
      await page.getByLabel("Security code").press("Enter");

      await expect(page.getByText("Your CVC is invalid")).not.toBeVisible();
    });

    test("does show errors for incorrect card number", async ({ page }) => {
      await page.getByLabel("Card number").fill(CardLib.invalidCardNumber);
      await page.getByLabel("Card number").press("Enter");

      await expect(page.getByText("Your card number is invalid")).toBeVisible();
    });

    test("does show errors for incorrect exiry date", async ({ page }) => {
      await page
        .getByLabel("Expiration date")
        .fill(CardLib.invalidExpirationData);
      await page.getByLabel("Expiration date").press("Enter");

      await expect(
        page.getByText("Your expiration date is invalid")
      ).toBeVisible();
    });

    test("does show errors for incorrect cvv", async ({ page }) => {
      await page.getByLabel("Card number").fill(CardLib.validCardNumber);
      await page.getByLabel("Card number").press("Enter");
      await page
        .getByLabel("Expiration date")
        .fill(CardLib.validExpirationData);
      await page.getByLabel("Expiration date").press("Enter");
      // AMEX code is invalid for non-AMEX cards
      await page.getByLabel("Security code").fill(CardLib.validAmexCVV);
      await page.getByLabel("Security code").press("Enter");

      await expect(page.getByText("Your CVC is invalid")).toBeVisible();
    });
  });

  test.describe("v2 render with CCV disabled", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(
        `http://localhost:4173/v2/?team=${teamUuid}&app=${appUuid}&disableCVV=true`
      );
    });

    test("renders inputs without CVV", async ({ page }) => {
      await expect(page.getByLabel("Card number")).toBeVisible();
      await expect(page.getByLabel("Expiration date")).toBeVisible();
    });

    test("does not show errors for correct fields", async ({ page }) => {
      await page.getByLabel("Card number").fill(CardLib.validCardNumber);
      await page.getByLabel("Card number").press("Enter");
      await page
        .getByLabel("Expiration date")
        .fill(CardLib.validExpirationData);
      await page.getByLabel("Expiration date").press("Enter");

      await expect(
        page.getByText("Your card number is invalid")
      ).not.toBeVisible();
    });

    test("does show errors for incorrect card number", async ({ page }) => {
      await page.getByLabel("Card number").fill(CardLib.invalidCardNumber);
      await page.getByLabel("Card number").press("Enter");

      await expect(page.getByText("Your card number is invalid")).toBeVisible();
    });

    test("does show errors for incorrect exiry date", async ({ page }) => {
      await page
        .getByLabel("Expiration date")
        .fill(CardLib.invalidExpirationData);
      await page.getByLabel("Expiration date").press("Enter");

      await expect(
        page.getByText("Your expiration date is invalid")
      ).toBeVisible();
    });
  });

  test.describe("v2 render with expiry disabled", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(
        `http://localhost:4173/v2/?team=${teamUuid}&app=${appUuid}&disableExpiry=true`
      );
    });

    test("renders inputs without expiry", async ({ page }) => {
      await expect(page.getByLabel("Card number")).toBeVisible();
      await expect(page.getByLabel("Security code")).toBeVisible();
      await expect(page.getByLabel("Expiration date")).not.toBeVisible();
    });

    test("does not show errors for correct fields", async ({ page }) => {
      await page.getByLabel("Card number").fill(CardLib.validCardNumber);
      await page.getByLabel("Card number").press("Enter");

      await expect(
        page.getByText("Your card number is invalid")
      ).not.toBeVisible();
    });

    test("does show errors for incorrect card number", async ({ page }) => {
      await page.getByLabel("Card number").fill(CardLib.invalidCardNumber);
      await page.getByLabel("Card number").press("Enter");

      await expect(page.getByText("Your card number is invalid")).toBeVisible();
    });
  });

  test.describe("v2 render with expiry and CVV disabled", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(
        `http://localhost:4173/v2/?team=${teamUuid}&app=${appUuid}&disableExpiry=true&disableCVV=true`
      );
    });

    test("renders inputs without expiry", async ({ page }) => {
      await expect(page.getByLabel("Card number")).toBeVisible();
      await expect(page.getByLabel("Security code")).not.toBeVisible();
      await expect(page.getByLabel("Expiration date")).not.toBeVisible();
    });

    test("does not show errors for correct fields", async ({ page }) => {
      await page.getByLabel("Card number").fill(CardLib.validCardNumber);
      await page.getByLabel("Card number").press("Enter");

      await expect(
        page.getByText("Your card number is invalid")
      ).not.toBeVisible();
    });

    test("does show errors for incorrect card number", async ({ page }) => {
      await page.getByLabel("Card number").fill(CardLib.invalidCardNumber);
      await page.getByLabel("Card number").press("Enter");

      await expect(page.getByText("Your card number is invalid")).toBeVisible();
    });
  });
});
