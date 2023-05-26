import { test, expect } from "@playwright/test";

const teamUuid = "59a96deeef03";
const appUuid = "app_869a0605f7c3";
const fontUrl = encodeURIComponent(
  "https://fonts.googleapis.com/css2?family=Poppins:wght@100;800&display=swap"
);
const fontFamily = encodeURIComponent("'Poppins', sans-serif");
const labelWeight = "300";
const labelFontSize = "24px";
const inputFontSize = "30px";

test.describe("evervault inputs", () => {
  test.describe("v2 render localized inputs with custom fonts", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(
        `http://localhost:4173/v2/?team=${teamUuid}&app=${appUuid}&fontUrl=${fontUrl}&fontFamily=${fontFamily}&labelWeight=${labelWeight}&labelFontSize=${labelFontSize}&inputFontSize=${inputFontSize}`
      );
      expect(page.locator("id=font-url")).toBeTruthy();
    });

    test("renders inputs with a custom font", async ({ page }) => {
      await expect(page.locator("body")).toHaveCSS("font-family", /Poppins/);
      await expect(page.locator("body")).toHaveCSS("font-family", /sans-serif/);
    });

    test("inserts google fonts preconnect tags", async ({ page }) => {
      await expect(page.locator("[id=font-preconnect]")).toBeTruthy();
      await expect(page.locator("[id=font-preconnect-cors]")).toBeTruthy();
    });

    test("asserts that LabelFontSize is set to 24px", async ({ page }) => {
      await expect(
        // We need to filter by testId because there are multiple labels with the same text
        page.getByTestId("expirationDateLabel").filter({
          hasText: "Expiration date",
        })
      ).toHaveCSS("font-size", "24px");
    });

    test("asserts that labelWeight is set to 300", async ({ page }) => {
      await expect(
        page.getByTestId("expirationDateLabel").filter({
          hasText: "Expiration date",
        })
      ).toHaveCSS("font-weight", "300");
    });

    test("asserts that inputFontSize is set to 30px", async ({ page }) => {
      await expect(page.getByLabel("Expiration date")).toHaveCSS(
        "font-size",
        "30px"
      );
    });
  });
});
