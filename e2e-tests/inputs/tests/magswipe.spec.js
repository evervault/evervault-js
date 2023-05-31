import { test, expect } from "@playwright/test";

const EV_STRING_REGEX = /((ev(:|%3A))(debug(:|%3A))?(([A-z0-9+/=%]+)(:|%3A))?((number|boolean|string)(:|%3A))?(([A-z0-9+/=%]+)(:|%3A)){3}(\$|%24))|(((eyJ[A-z0-9+=.]+){2})([\w]{8}(-[\w]{4}){3}-[\w]{12}))/;

test.setTimeout(120000);

test.describe("evervault inputs", () => {
  test.describe("v2 event testing", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(
        "http://localhost:9000/v2/?team=59a96deeef03&app=app_869a0605f7c3"
      );
    });

    test("Track 1 MagSwipe", async ({ page }) => {
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

      await page
        .getByLabel("Card number")
        .type(
          "%B4242424242424242^CURRAN/SHANE.MR^3001123456?;4242424242424242=3001123456?"
        );
      await page.getByLabel("Card number").press("Enter");

      await page.waitForTimeout(500);

      expect(calls).toBeGreaterThan(0);
      expect(data.encryptedCard.bin).toMatch("424242");
      expect(data.encryptedCard.number).toMatch(EV_STRING_REGEX);
      expect(data.encryptedCard.name).toMatch("Shane Curran");
      expect(data.encryptedCard.lastFour).toMatch("4242");
      expect(data.encryptedCard.type).toMatch("visa");
      expect(data.encryptedCard.expYear).toMatch("30");
      expect(data.encryptedCard.expMonth).toMatch("01");
      expect(data.encryptedCard.swipe).toBe(true);
      expect(data.encryptedCard.track.fullTrack).toMatch(EV_STRING_REGEX);
      expect(data.encryptedCard.track.trackOne).toMatch(EV_STRING_REGEX);
      expect(data.encryptedCard.track.trackTwo).toMatch(EV_STRING_REGEX);
      expect(data.encryptedCard.cvc).toMatch("");
      expect(data.isEmpty).toBe(false);
      expect(data.isPotentiallyValid).toBe(true);
      expect(data.isPotentiallyValid).toBe(true);
      expect(data.isValid).toBe(false);

      await expect(page.getByLabel("Card number")).toHaveValue("4242 4242 4242 4242");
      await expect(page.getByLabel("Expiration date")).toHaveValue("01 / 30");
      await expect(page.getByLabel("Security code")).toHaveValue("");
    });

    test("Track 2 MagSwipe", async ({ page }) => {
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

      await page.getByLabel("Card number").type(";4242424242424242=3001123456?");
      await page.getByLabel("Card number").press("Enter");

      await page.waitForTimeout(500);

      expect(calls).toBeGreaterThan(0);

      // Test callback values
      expect(data.encryptedCard.bin).toMatch("424242");
      expect(data.encryptedCard.number).toMatch(EV_STRING_REGEX);
      expect(data.encryptedCard.name).toMatch("");
      expect(data.encryptedCard.lastFour).toMatch("4242");
      expect(data.encryptedCard.type).toMatch("visa");
      expect(data.encryptedCard.expYear).toMatch("30");
      expect(data.encryptedCard.expMonth).toMatch("01");
      expect(data.encryptedCard.swipe).toBe(true);
      expect(data.encryptedCard.track.fullTrack).toMatch(EV_STRING_REGEX);
      expect(data.encryptedCard.track.trackOne).toMatch("");
      expect(data.encryptedCard.track.trackTwo).toMatch(EV_STRING_REGEX);
      expect(data.encryptedCard.cvc).toMatch("");
      expect(data.isEmpty).toBe(false);
      expect(data.isPotentiallyValid).toBe(true);
      expect(data.isPotentiallyValid).toBe(true);
      expect(data.isValid).toBe(false);

      await expect(page.getByLabel("Card number")).toHaveValue("4242 4242 4242 4242");
      await expect(page.getByLabel("Expiration date")).toHaveValue("01 / 30");
      await expect(page.getByLabel("Security code")).toHaveValue("");
    });
  });
});
