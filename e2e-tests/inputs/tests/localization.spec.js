import { test, expect } from "@playwright/test";

import translations from "../fixtures/translations.json";
import { CardLib } from "../utils.js";

const locales = ["GA", "FR", "SV", "DE"];

const createLocaleUrl = (locale) => {
  const localeTranslations = translations[locale];
  let url = new URL("http://localhost:9000/v2");
  url.searchParams.append("team", "59a96deeef03");
  url.searchParams.append("app", "app_869a0605f7c3");
  url.searchParams.append(
    "cardNumberLabel",
    localeTranslations.cardNumberLabel
  );
  url.searchParams.append(
    "invalidCardNumberLabel",
    localeTranslations.invalidCardNumberLabel
  );
  url.searchParams.append(
    "expirationDateLabel",
    localeTranslations.expirationDateLabel
  );
  url.searchParams.append(
    "expirationDatePlaceholder",
    localeTranslations.expirationDatePlaceholder
  );
  url.searchParams.append(
    "invalidExpirationDateLabel",
    localeTranslations.invalidExpirationDateLabel
  );
  url.searchParams.append(
    "invalidCardNumberLabel",
    localeTranslations.invalidCardNumberLabel
  );
  url.searchParams.append(
    "invalidSecurityCodeLabel",
    localeTranslations.invalidSecurityCodeLabel
  );
  url.searchParams.append(
    "securityCodeLabel",
    localeTranslations.securityCodeLabel
  );
  url.searchParams.append(
    "invalidSecurityCodeLabel",
    localeTranslations.invalidSecurityCodeLabel
  );

  return url.toString();
};

test.describe("evervault inputs", () => {
  locales.forEach((locale) => {
    test.describe(`v2 render localized inputs for locale ${locale}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(createLocaleUrl(locale));
      });

      test("renders inputs", async ({ page }) => {
        await expect(
          page.getByLabel(translations[locale].cardNumberLabel)
        ).toBeVisible();
        await expect(
          page.getByLabel(translations[locale].expirationDateLabel)
        ).toBeVisible();
        await expect(
          page.getByLabel(translations[locale].securityCodeLabel)
        ).toBeVisible();
      });

      test("renders card number error in localized language", async ({
        page,
      }) => {
        await page
          .getByLabel(translations[locale].cardNumberLabel)
          .fill(CardLib.invalidCardNumber);
        await page
          .getByLabel(translations[locale].cardNumberLabel)
          .press("Enter");

        await expect(
          page.getByText(translations[locale].invalidCardNumberLabel)
        ).toBeVisible();
      });

      test("renders expiration date error in localized language", async ({
        page,
      }) => {
        await page
          .getByLabel(translations[locale].expirationDateLabel)
          .fill(CardLib.invalidExpirationData);
        await page
          .getByLabel(translations[locale].expirationDateLabel)
          .press("Enter");

        await expect(
          page.getByText(translations[locale].invalidExpirationDateLabel)
        ).toBeVisible();
      });

      test("renders security code error in localized language", async ({
        page,
      }) => {
        await page
          .getByLabel(translations[locale].cardNumberLabel)
          .fill(CardLib.validCardNumber);
        await page
          .getByLabel(translations[locale].cardNumberLabel)
          .press("Enter");
        await page
          .getByLabel(translations[locale].expirationDateLabel)
          .fill(CardLib.validExpirationData);
        await page
          .getByLabel(translations[locale].expirationDateLabel)
          .press("Enter");
        // AMEX code is invalid for non-AMEX cards
        await page
          .getByLabel(translations[locale].securityCodeLabel)
          .fill(CardLib.validAmexCVV);
        await page
          .getByLabel(translations[locale].securityCodeLabel)
          .press("Enter");

        await expect(
          page.getByText(translations[locale].invalidSecurityCodeLabel)
        ).toBeVisible();
      });
    });
  });
});
