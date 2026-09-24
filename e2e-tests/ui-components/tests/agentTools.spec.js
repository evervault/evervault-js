import { test, expect, VALID_CARDS } from "../utils";

const COMPONENTS_ORIGIN = "http://localhost:4001";
const HOST_ORIGIN = "http://localhost:4005";
// Same server, different origin: used to prove exposeTo hides the tools.
const OTHER_ORIGIN = "http://[::1]:4005";

const TOOL_NAMES = [
  "acmepay-focus-card-field",
  "acmepay-get-card-form-status",
  "acmepay-submit-card",
];

test.describe("card agent tools (WebMCP)", () => {
  test.skip(
    () => test.info().project.name !== "chrome-webmcp",
    "needs the chrome-webmcp project"
  );

  async function mountCard(page, agentTools) {
    await page.waitForFunction(() => window.Evervault);
    await page.evaluate(async (agentTools) => {
      window.submissions = [];
      window.card = window.evervault.ui.card({ agentTools });
      window.card.on("submit", (payload) => window.submissions.push(payload));
      const ready = new Promise((resolve) => window.card.on("ready", resolve));
      window.card.mount("#form");
      await ready;

      // Chrome builds before 155 exchange JSON strings rather than objects
      // in both directions, so accept either form.
      window.callTool = async (suffix, args = {}) => {
        const tools = await document.modelContext.getTools({
          fromOrigins: ["http://localhost:4001"],
        });
        const tool = tools.find((t) => t.name.endsWith(suffix));
        if (!tool) throw new Error(`tool ${suffix} not found`);
        const { executeTool } = document.modelContext;
        let result;
        try {
          result = await executeTool.call(document.modelContext, tool, args);
        } catch (error) {
          if (!String(error).includes("parse")) throw error;
          result = await executeTool.call(
            document.modelContext,
            tool,
            JSON.stringify(args)
          );
        }
        return typeof result === "string" ? JSON.parse(result) : result;
      };
    }, agentTools);
  }

  async function listTools(page) {
    return page.evaluate(async (origin) => {
      const tools = await document.modelContext.getTools({
        fromOrigins: [origin],
      });
      return tools.map((t) => t.name).sort();
    }, COMPONENTS_ORIGIN);
  }

  test("delegates the tools permissions policy to the iframe", async ({
    page,
  }) => {
    await page.goto(HOST_ORIGIN);
    await mountCard(page, { enabled: true, namePrefix: "acmepay" });

    await expect(page.locator("iframe[data-evervault]")).toHaveAttribute(
      "allow",
      "payment; tools"
    );
  });

  test("exposes the tools to the host origin by default", async ({ page }) => {
    await page.goto(HOST_ORIGIN);
    await mountCard(page, {
      enabled: true,
      namePrefix: "acmepay",
      productName: "Acme Pay",
    });

    await expect.poll(() => listTools(page)).toEqual(TOOL_NAMES);

    const descriptions = await page.evaluate(async (origin) => {
      const tools = await document.modelContext.getTools({
        fromOrigins: [origin],
      });
      return tools.map((t) => t.description);
    }, COMPONENTS_ORIGIN);

    for (const description of descriptions) {
      expect(description).toContain("Acme Pay");
      expect(description.toLowerCase()).not.toContain("evervault");
    }
  });

  test("hides the tools from origins outside exposeTo", async ({ page }) => {
    await page.goto(OTHER_ORIGIN);
    await mountCard(page, {
      enabled: true,
      namePrefix: "acmepay",
      exposeTo: [HOST_ORIGIN],
    });

    // Give registration time to happen, then confirm nothing is visible.
    await page.waitForTimeout(1000);
    expect(await listTools(page)).toEqual([]);
  });

  test("registers nothing when agent tools are disabled", async ({ page }) => {
    await page.goto(HOST_ORIGIN);
    await mountCard(page, undefined);

    await expect(page.locator("iframe[data-evervault]")).toHaveAttribute(
      "allow",
      "payment"
    );
    await page.waitForTimeout(1000);
    expect(await listTools(page)).toEqual([]);
  });

  test("reports status without card values and rejects incomplete submits", async ({
    page,
  }) => {
    await page.goto(HOST_ORIGIN);
    await mountCard(page, {
      enabled: true,
      namePrefix: "acmepay",
      productName: "Acme Pay",
    });
    await expect.poll(() => listTools(page)).toEqual(TOOL_NAMES);

    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill(VALID_CARDS.visa.number);

    const status = await page.evaluate(() =>
      window.callTool("get-card-form-status")
    );
    expect(status.isComplete).toBe(false);
    expect(status.fields).toEqual([
      expect.objectContaining({
        field: "number",
        hasValue: true,
        isValid: true,
      }),
      expect.objectContaining({
        field: "expiry",
        hasValue: false,
        isValid: false,
      }),
      expect.objectContaining({
        field: "cvc",
        hasValue: false,
        isValid: false,
      }),
    ]);
    expect(JSON.stringify(status)).not.toContain("4242");

    // Chrome 154 collapses tool exceptions into a generic UnknownError, so
    // assert the rejection plus its visible side effect rather than the text.
    const rejected = await page.evaluate(() =>
      window.callTool("submit-card").then(
        () => false,
        () => true
      )
    );
    expect(rejected).toBe(true);
    await expect(
      frame.getByText("Your expiration date is invalid")
    ).toBeVisible();
    await expect(frame.getByText("Your CVC is invalid")).toBeVisible();
    expect(await page.evaluate(() => window.submissions.length)).toBe(0);
  });

  test("submits a complete form and emits the encrypted payload to the host", async ({
    page,
  }) => {
    await page.goto(HOST_ORIGIN);
    await mountCard(page, { enabled: true, namePrefix: "acmepay" });
    await expect.poll(() => listTools(page)).toEqual(TOOL_NAMES);

    const card = VALID_CARDS.visa;
    const frame = page.frameLocator("iframe[data-evervault]");
    await frame.getByLabel("Number").fill(card.number);
    await frame.getByLabel("Expiration").fill(`${card.month}/${card.year}`);
    await frame.getByLabel("CVC").fill(card.cvc);

    const result = await page.evaluate(() => window.callTool("submit-card"));
    expect(result).toEqual({
      status: "submitted",
      brand: card.brand,
      lastFour: card.lastFour,
    });

    await expect
      .poll(() => page.evaluate(() => window.submissions.length))
      .toBe(1);
    const payload = await page.evaluate(() => window.submissions[0]);
    expect(payload.isComplete).toBe(true);
    expect(payload.card.number).toBeEncrypted();
    expect(payload.card.cvc).toBeEncrypted();
  });
});
