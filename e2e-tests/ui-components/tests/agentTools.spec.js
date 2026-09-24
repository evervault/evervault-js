import { test, expect, VALID_CARDS } from "../utils";

const COMPONENTS_ORIGIN = "http://localhost:4001";
const HOST_ORIGIN = "http://localhost:4005";
// Same server, different origin: used to prove exposeTo hides the tools.
const OTHER_ORIGIN = "http://[::1]:4005";

const TOOL_NAMES = [
  "acmepay-focus-card-field",
  "acmepay-get-card-form-status",
  "acmepay-set-card-field-value",
];

test.describe("card agent tools (WebMCP)", () => {
  test.skip(
    () => test.info().project.name !== "chrome-webmcp",
    "needs the chrome-webmcp project"
  );

  async function mountCard(page, agentTools) {
    await page.waitForFunction(() => window.Evervault);
    await page.evaluate(async (agentTools) => {
      window.card = window.evervault.ui.card({ agentTools });
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

  test("reports status without card values", async ({ page }) => {
    await page.goto(HOST_ORIGIN);
    await mountCard(page, { enabled: true, namePrefix: "acmepay" });
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
  });

  test("fills fields like a user would and validates each one", async ({
    page,
  }) => {
    await page.goto(HOST_ORIGIN);
    await mountCard(page, {
      enabled: true,
      namePrefix: "acmepay",
      productName: "Acme Pay",
    });
    await expect.poll(() => listTools(page)).toEqual(TOOL_NAMES);

    const card = VALID_CARDS.visa;
    const frame = page.frameLocator("iframe[data-evervault]");

    const afterBadCvc = await page.evaluate(() =>
      window.callTool("set-card-field-value", { field: "cvc", value: "12" })
    );
    expect(afterBadCvc.fields[2]).toEqual(
      expect.objectContaining({ field: "cvc", hasValue: true, isValid: false })
    );
    await expect(frame.getByText("Your CVC is invalid")).toBeVisible();

    await page.evaluate(
      (card) =>
        window.callTool("set-card-field-value", {
          field: "number",
          value: card.number,
        }),
      card
    );
    await page.evaluate(
      (card) =>
        window.callTool("set-card-field-value", {
          field: "expiry",
          value: `${card.month}/${card.year}`,
        }),
      card
    );
    const status = await page.evaluate(
      (card) =>
        window.callTool("set-card-field-value", {
          field: "cvc",
          value: card.cvc,
        }),
      card
    );

    expect(status.isComplete).toBe(true);
    expect(JSON.stringify(status)).not.toContain(card.number);
    await expect(frame.getByLabel("Number")).toHaveValue("4242 4242 4242 4242");
    await expect(frame.getByLabel("Expiration")).toHaveValue("01 / 35");
    await expect(frame.getByLabel("CVC")).toHaveValue(card.cvc);
    await expect(frame.getByText("Your CVC is invalid")).toBeHidden();
  });
});
