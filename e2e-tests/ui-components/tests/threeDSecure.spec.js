import { test, expect } from "../utils";

test.describe("threeDSecure component", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4005");
    await page.waitForFunction(() => window.Evervault);
  });

  test("can complete 3DS authentication", async ({ page }) => {
    let called = false;

    await page.exposeFunction("handleSuccess", () => {
      called = true;
    });

    const session = await createThreeDSSession("4242424242424242");

    await page.evaluate((sessionId) => {
      const comp = window.evervault.ui.threeDSecure(sessionId);
      comp.on("success", window.handleSuccess);
      comp.mount();
    }, session.id);

    const frame = page.frameLocator("iframe[data-evervault]");
    const acsFrame = frame.frameLocator("iframe[name='challengeFrame']");
    const code = acsFrame.locator("input");
    code.pressSequentially("111111");
    await expect.poll(async () => called).toBeTruthy();
  });

  test("can successfully complete with frictionless flow", async ({ page }) => {
    let called = false;

    await page.exposeFunction("handleSuccess", () => {
      called = true;
    });

    const session = await createThreeDSSession("5555550130659057");

    await page.evaluate((sessionId) => {
      const comp = window.evervault.ui.threeDSecure(sessionId);
      comp.on("success", window.handleSuccess);
      comp.mount();
    }, session.id);

    await expect.poll(async () => called).toBeTruthy();
  });

  test("triggers failure event when 3DS fails", async ({ page }) => {
    let called = false;

    await page.exposeFunction("handleFailure", () => {
      called = true;
    });

    const session = await createThreeDSSession("4242424242424242");

    await page.evaluate((sessionId) => {
      const comp = window.evervault.ui.threeDSecure(sessionId);
      comp.on("failure", window.handleFailure);
      comp.mount();
    }, session.id);

    const frame = page.frameLocator("iframe[data-evervault]");
    const acsFrame = frame.frameLocator("iframe[name='challengeFrame']");
    const code = acsFrame.locator("input");
    code.pressSequentially("222222");
    await expect.poll(async () => called).toBeTruthy();
  });

  test("can fail with frictionless flow", async ({ page }) => {
    let called = false;

    await page.exposeFunction("handleFailure", () => {
      called = true;
    });

    const session = await createThreeDSSession("5555550487847545");

    await page.evaluate((sessionId) => {
      const comp = window.evervault.ui.threeDSecure(sessionId);
      comp.on("failure", window.handleFailure);
      comp.mount();
    }, session.id);

    await expect.poll(async () => called).toBeTruthy();
  });

  test("can intentionally fail 3DS on challenge", async ({ page }) => {
    let failed = false;

    await page.exposeFunction("handleFailure", () => {
      failed = true;
    });

    const session = await createThreeDSSession("4242424242424242");

    await page.evaluate((sessionId) => {
      const comp = window.evervault.ui.threeDSecure(sessionId, {
        failOnChallenge: true,
      });

      comp.on("failure", window.handleFailure);
      comp.mount();
    }, session.id);

    await expect.poll(async () => failed).toBeTruthy();
  });

  test("can intentionally fail 3DS on challenge with callback", async ({
    page,
  }) => {
    let failed = false;

    await page.exposeFunction("handleFailure", () => {
      failed = true;
    });

    const session = await createThreeDSSession("4242424242424242");

    await page.evaluate((sessionId) => {
      const comp = window.evervault.ui.threeDSecure(sessionId, {
        failOnChallenge: () => {
          return true;
        },
      });

      comp.on("failure", window.handleFailure);
      comp.mount();
    }, session.id);

    await expect.poll(async () => failed).toBeTruthy();
  });

  test("can fail 3DS on challenge with callback that returns a promise", async ({
    page,
  }) => {
    let failed = false;

    await page.exposeFunction("handleFailure", () => {
      failed = true;
    });

    const session = await createThreeDSSession("4242424242424242");

    await page.evaluate((sessionId) => {
      const comp = window.evervault.ui.threeDSecure(sessionId, {
        failOnChallenge: async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return true;
        },
      });

      comp.on("failure", window.handleFailure);
      comp.mount();
    }, session.id);

    await expect.poll(async () => failed).toBeTruthy();
  });

  test("can show 3DS challenge with callback", async ({ page }) => {
    let failed = false;
    let success = false;

    await page.exposeFunction("handleFailure", () => {
      failed = true;
    });

    await page.exposeFunction("handleSuccess", () => {
      success = true;
    });

    const session = await createThreeDSSession("4242424242424242");

    await page.evaluate((sessionId) => {
      const comp = window.evervault.ui.threeDSecure(sessionId, {
        failOnChallenge: async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return false;
        },
      });

      comp.on("failure", window.handleFailure);
      comp.on("success", window.handleSuccess);
      comp.mount();
    }, session.id);

    await expect.poll(async () => failed).toBeFalsy();

    const frame = page.frameLocator("iframe[data-evervault]");
    const acsFrame = frame.frameLocator("iframe[name='challengeFrame']");
    const code = acsFrame.locator("input");
    code.pressSequentially("111111");
    await expect.poll(async () => success, { timeout: 7500 }).toBeTruthy();
  });
});

async function createThreeDSSession(number) {
  return evervaultAPI("POST", "/payments/3ds-sessions", {
    card: {
      number,
      cvv: "123",
      expiry: {
        month: "01",
        year: "30",
      },
    },
    merchant: {
      name: "Test Merchant",
      website: "https://test-merchant.com",
      categoryCode: "4011",
      country: "ie",
    },
    payment: {
      type: "one-off",
      amount: 1000,
      currency: "eur",
    },
    acquirer: {
      bin: "444444",
      merchantIdentifier: "837223891854392",
      country: "ie",
    },
  });
}

async function evervaultAPI(method, path, payload) {
  const token = btoa(
    `${process.env.VITE_EV_APP_UUID}:${process.env.EV_API_KEY}`
  );
  const response = await fetch(`${process.env.VITE_API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}
