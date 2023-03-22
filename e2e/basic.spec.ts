import { test, expect } from "@playwright/test";

const encryptedStringRegex =
  /((ev(:|%3A))(debug(:|%3A))?(([A-z0-9+/=%]+)(:|%3A))?((number|boolean|string)(:|%3A))?(([A-z0-9+/=%]+)(:|%3A)){3}(\$|%24))|(((eyJ[A-z0-9+=.]+){2})([\w]{8}(-[\w]{4}){3}-[\w]{12}))/;

test("has title", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Evervault Test/);
});

test("encrypts a string", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  const output = await page.getByTestId("ev-encrypt-output");

  await expect(output).toHaveText(/OUTPUT GOES HERE/);

  await page.getByTestId("ev-encrypt-input").fill("Hello World");
  await page.getByTestId("ev-encrypt-submit").click();

  await expect(output).toHaveText(encryptedStringRegex);
});
