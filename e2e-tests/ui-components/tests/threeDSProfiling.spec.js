import { test, expect } from "../utils";

test.describe("3DS profiling", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4005");
    await page.waitForFunction(() => window.Evervault);
  });

  test("the Card gives no profiling ID without the option", async ({
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
    await frame.getByLabel("Number").fill("5555550130659057");
    await frame.getByLabel("Expiration").fill("01/35");
    await frame.getByLabel("CVC").fill("123");
    await expect.poll(async () => values.isValid).toBeTruthy();
    expect(values.threeDSProfilingId).toBeNull();
  });

  test("the Card gives a profiling ID with the option", async ({ page }) => {
    const profilingId = await getProfilingId(page, "5555550130659057");
    expect(profilingId).toMatch(/\S/);
  });

  test("a frictionless profiled session succeeds without showing the window", async ({
    page,
  }) => {
    let succeeded = false;
    let errored = false;
    let challenged = false;

    await page.exposeFunction("handleSuccess", () => {
      succeeded = true;
    });
    await page.exposeFunction("handleError", () => {
      errored = true;
    });
    page.on("frameattached", (frame) => {
      if (frame.name() === "challengeFrame") challenged = true;
    });

    const number = "5555550130659057";
    const profilingId = await getProfilingId(page, number);
    const session = await createThreeDSSession(number, profilingId);

    await page.evaluate((sessionId) => {
      // The overlay is removed on unmount, so watch it for the whole run.
      window.overlayShown = false;
      new MutationObserver(() => {
        const overlays = document.querySelectorAll("[id^='ev-modal-']");
        for (const overlay of overlays) {
          if (overlay.style.visibility !== "hidden") window.overlayShown = true;
        }
      }).observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["style"],
      });

      const comp = window.evervault.ui.threeDSecure(sessionId);
      comp.on("success", window.handleSuccess);
      comp.on("error", window.handleError);
      comp.mount();
    }, session.id);

    await expect.poll(async () => succeeded).toBeTruthy();
    await expect.poll(async () => errored, { timeout: 1000 }).toBeFalsy();
    expect(await page.evaluate(() => window.overlayShown)).toBe(false);
    expect(challenged).toBe(false);
  });

  test("a challenge with a profiling ID still succeeds", async ({ page }) => {
    let succeeded = false;

    await page.exposeFunction("handleSuccess", () => {
      succeeded = true;
    });

    const number = "4242424242424242";
    const profilingId = await getProfilingId(page, number);
    const session = await createThreeDSSession(number, profilingId);

    await page.evaluate((sessionId) => {
      const comp = window.evervault.ui.threeDSecure(sessionId);
      comp.on("success", window.handleSuccess);
      comp.mount();
    }, session.id);

    // The Card is also an Evervault frame, so pick the one in the 3DS overlay.
    const frame = page.frameLocator("[id^='ev-modal-'] iframe[data-evervault]");
    const acsFrame = frame.frameLocator("iframe[name='challengeFrame']");
    await acsFrame.locator("input").pressSequentially("111111");
    await expect.poll(async () => succeeded).toBeTruthy();
  });
});

// Mounts a Card with `threeDSProfiling` on, fills the number and waits for
// the profiling ID. The Card profiles as soon as the number is valid.
async function getProfilingId(page, number) {
  let values = {};

  await page.exposeFunction("handleProfilingChange", (newValues) => {
    values = newValues;
  });

  await page.evaluate(() => {
    const comp = window.evervault.ui.card({ threeDSProfiling: true });
    comp.on("change", window.handleProfilingChange);
    comp.mount("#form");
  });

  const frame = page.frameLocator("iframe[data-evervault]");
  await frame.getByLabel("Number").fill(number);
  await expect
    .poll(async () => values.threeDSProfilingId ?? "", { timeout: 10000 })
    .toMatch(/\S/);

  return values.threeDSProfilingId;
}

// Same as in threeDSecure.spec.js, with an optional profiling ID. Throws if
// the API gives no session, so the test fails here with the API's error.
async function createThreeDSSession(number, profilingId) {
  const session = await evervaultAPI("POST", "/payments/3ds-sessions", {
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
    ...(profilingId && { profilingId }),
  });

  if (!session.id) {
    throw new Error(
      `Could not create the 3DS session: ${JSON.stringify(session)}`
    );
  }

  return session;
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
