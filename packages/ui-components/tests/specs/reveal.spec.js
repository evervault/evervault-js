import { test, expect } from "../utils";

test.describe("reveal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4005");
    await page.waitForFunction(() => window.Evervault);
    // Create a window function for creating a decrypt request inside of the page. This is just a
    // helper to prevent having to have this code in every test.
    const auth = btoa(process.env.EV_APP_UUID + ":" + process.env.EV_API_KEY);
    await page.evaluate(
      ([authToken, apiUrl]) => {
        window.decryptRequest = (data) =>
          new Request(`${apiUrl}/decrypt`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${authToken}`,
            },
            body: JSON.stringify(data),
          });
      },
      [auth, process.env.VITE_API_URL]
    );
  });

  test("can reveal text", async ({ page }) => {
    const testData = await encryptWithAPI({
      card: {
        number: "4242424242424242",
      },
    });

    await page.evaluate((data) => {
      const request = window.decryptRequest(data);
      const reveal = window.evervault.ui.reveal(request);
      reveal.text("$.card.number").mount("#form");
    }, testData);

    const frame = page.frameLocator("iframe[ev-component=RevealText]");
    await expect(frame.getByText("4242424242424242")).toBeVisible();
  });

  test("can format text", async ({ page }) => {
    const testData = await encryptWithAPI({
      card: {
        number: "4242424242424242",
      },
    });
    await page.evaluate((data) => {
      const request = window.decryptRequest(data);
      const reveal = window.evervault.ui.reveal(request);
      reveal
        .text("$.card.number", {
          format: {
            regex: /(\d{4})(\d{4})(\d{4})(\d{4})/g,
            replace: "$1 $2 $3 $4",
          },
        })
        .mount("#form");
    }, testData);
    const frame = page.frameLocator("iframe[ev-component=RevealText]");
    await expect(
      frame.getByText("4242 4242 4242 4242", { exact: true })
    ).toBeVisible();
  });

  test("triggers error callback when request failes", async ({ page }) => {
    let called = 0;

    await page.exposeFunction("handleError", () => {
      called += 1;
    });

    await page.evaluate(() => {
      const request = new Request("https://api.evervault.io/decrypt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa("invalid:credentials")}`,
        },
        body: JSON.stringify({}),
      });

      const reveal = window.evervault.ui.reveal(request);
      reveal.on("error", window.handleError);
      reveal.text("$.card.number").mount("#form");
    });

    await expect.poll(async () => called).toBe(1);
  });

  test("can render a copy button", async ({ page }) => {
    let mockedClipboardValue = "";
    let handleCopyCalls = 0;

    await page.exposeFunction("mockClipboard", async (value) => {
      mockedClipboardValue = value;
      Promise.resolve();
    });

    await page.exposeFunction("handleCopy", () => {
      handleCopyCalls += 1;
    });

    await page.addInitScript(() => {
      window.navigator.clipboard.writeText = async (value) => {
        await window.mockClipboard(value);
      };
    });

    const testData = await encryptWithAPI({
      card: {
        number: "4242424242424242",
      },
    });

    await page.evaluate((data) => {
      const request = window.decryptRequest(data);
      const reveal = window.evervault.ui.reveal(request);
      window.btn = reveal.copyButton("$.card.number");
      window.btn.on("copy", window.handleCopy);
      window.btn.mount("#form");
    }, testData);

    const frame = page.frameLocator("iframe[ev-component=RevealCopyButton]");
    await frame.getByText("Copy").click();
    await expect
      .poll(async () => mockedClipboardValue)
      .toBe("4242424242424242");

    await expect.poll(async () => handleCopyCalls).toBe(1);

    await page.evaluate(() => {
      window.btn.unmount();
    });

    await expect(
      page.locator("iframe[ev-component=RevealCopyButton]")
    ).not.toBeVisible();
  });
});

async function encryptWithAPI(data) {
  const auth = btoa(process.env.EV_APP_UUID + ":" + process.env.EV_API_KEY);
  const response = await fetch(`${process.env.VITE_API_URL}/encrypt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(data),
  });

  return response.json();
}
