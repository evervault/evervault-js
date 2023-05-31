import { test, expect } from "@playwright/test";
import { CardLib } from "../utils.js";

const EV_STRING_REGEX = /((ev(:|%3A))(debug(:|%3A))?(([A-z0-9+/=%]+)(:|%3A))?((number|boolean|string)(:|%3A))?(([A-z0-9+/=%]+)(:|%3A)){3}(\$|%24))|(((eyJ[A-z0-9+=.]+){2})([\w]{8}(-[\w]{4}){3}-[\w]{12}))/;

test.describe("evervault inputs", () => {
  test.describe("v2 event testing", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(
        "http://localhost:9000/v2/?team=59a96deeef03&app=app_869a0605f7c3"
      );
    });

    test("fires event for card number", async ({ page }) => {
      let data = null;
      let calls = 0;

      await page.exposeFunction("postToTest", (newData) => {
        data = newData;
        calls++;
      });
      await page.evaluate(() => {
        window.addEventListener("message", (event) => {
          window.postToTest(event.data);
        });
      });

      await page.getByLabel("Card number").type(CardLib.validCardNumber);
      await page
        .getByLabel("Expiration date")
        .fill(CardLib.validExpirationData);
      await page.getByLabel("Security code").fill(CardLib.validSecurityCode);

      await page.waitForTimeout(800);

      expect(calls).toBeGreaterThan(0);
      expect(data.encryptedCard.number).toMatch(EV_STRING_REGEX);
      expect(data.encryptedCard.cvc).toMatch(EV_STRING_REGEX);
      expect(data.encryptedCard.lastFour).toMatch(CardLib.validCardNumber.slice(-4));
      expect(data.encryptedCard.expMonth).toMatch(CardLib.validExpirationData.split("/")[0]);
      expect(data.encryptedCard.expYear).toMatch(CardLib.validExpirationData.split("/")[1]);
      expect(data.encryptedCard.type).toMatch("visa");
      expect(data.isEmpty).toBe(false);
      expect(data.isPotentiallyValid).toBe(true);
      expect(data.isValid).toBe(true);
    });

    test("fires event for AMEX card number", async ({ page }) => {
      let data = null;
      let calls = 0;

      await page.exposeFunction("postToTest", (newData) => {
        data = newData;
        calls++;
      });
      await page.evaluate(() => {
        window.addEventListener("message", (event) => {
          window.postToTest(event.data);
        });
      });

      await page.getByLabel("Card number").type(CardLib.validAmexCard);
      await page
        .getByLabel("Expiration date")
        .fill(CardLib.validExpirationData);
      await page.getByLabel("Security code").fill(CardLib.validAmexCVV);

      await page.waitForTimeout(800);

      expect(calls).toBeGreaterThan(0);
      expect(data.encryptedCard.number).toMatch(EV_STRING_REGEX);
      expect(data.encryptedCard.cvc).toMatch(EV_STRING_REGEX);
      expect(data.encryptedCard.lastFour).toMatch(CardLib.validAmexCard.slice(-4));
      expect(data.encryptedCard.expMonth).toMatch(CardLib.validExpirationData.split("/")[0]);
      expect(data.encryptedCard.expYear).toMatch(CardLib.validExpirationData.split("/")[1]);
      expect(data.encryptedCard.type).toMatch("american-express");
      expect(data.isEmpty).toBe(false);
      expect(data.isPotentiallyValid).toBe(true);
      expect(data.isValid).toBe(true);
    });
  });
});
