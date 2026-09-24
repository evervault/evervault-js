import { describe, expect, it, vi } from "vitest";
import {
  buildAgentTools,
  buildFieldStatuses,
  incompleteFormMessage,
  type CardFormValidators,
} from "../src/Card/agentTools";
import type { CardForm } from "../src/Card/types";

const validators: CardFormValidators = {
  name: () => undefined,
  number: (v) => (v.number.length === 16 ? undefined : "invalid"),
  expiry: (v) => (v.expiry ? undefined : "invalid"),
  cvc: (v) => (v.cvc.length === 3 ? undefined : "invalid"),
};

const t = (key: string) => `t:${key}`;

const config = {
  namePrefix: "acmepay",
  productName: "Acme Pay",
  exposeTo: ["https://merchant.example"],
};

describe("buildFieldStatuses", () => {
  it("reports validity without exposing values", () => {
    const values: CardForm = {
      name: "",
      number: "4242424242424242",
      expiry: "",
      cvc: "12",
    };
    const statuses = buildFieldStatuses(
      ["number", "expiry", "cvc"],
      values,
      validators,
      t
    );

    expect(statuses).toEqual([
      {
        field: "number",
        hasValue: true,
        isValid: true,
        error: null,
        errorMessage: null,
      },
      {
        field: "expiry",
        hasValue: false,
        isValid: false,
        error: "invalid",
        errorMessage: "t:expiry.errors.invalid",
      },
      {
        field: "cvc",
        hasValue: true,
        isValid: false,
        error: "invalid",
        errorMessage: "t:cvc.errors.invalid",
      },
    ]);
    expect(JSON.stringify(statuses)).not.toContain("4242");
  });
});

describe("buildAgentTools", () => {
  const handlers = {
    getStatus: vi.fn(() => ({ fields: [], isComplete: false, focusedField: null })),
    focusField: vi.fn((field) => ({ focused: field })),
    submit: vi.fn(async () => ({
      status: "submitted" as const,
      brand: "visa",
      lastFour: "4242",
    })),
  };

  const tools = buildAgentTools(config, ["number", "expiry", "cvc"], handlers);

  it("prefixes tool names and brands descriptions with the product name", () => {
    expect(tools.map((tool) => tool.name)).toEqual([
      "acmepay-get-card-form-status",
      "acmepay-focus-card-field",
      "acmepay-submit-card",
    ]);
    for (const tool of tools) {
      expect(tool.description).toContain("Acme Pay");
      expect(tool.description.toLowerCase()).not.toContain("evervault");
    }
  });

  it("marks status as read-only and submit as consequential", () => {
    expect(tools[0].annotations?.readOnlyHint).toBe(true);
    expect(tools[2].annotations?.consequentialHint).toBe(true);
  });

  it("limits focusable fields to the rendered ones", () => {
    const schema = tools[1].inputSchema as {
      properties: { field: { enum: string[] } };
    };
    expect(schema.properties.field.enum).toEqual(["number", "expiry", "cvc"]);

    const signal = new AbortController().signal;
    expect(() => tools[1].execute({ field: "name" }, { signal })).toThrow(
      'Acme Pay does not show a "name" field.'
    );
    expect(tools[1].execute({ field: "cvc" }, { signal })).toEqual({
      focused: "cvc",
    });
  });
});

describe("incompleteFormMessage", () => {
  it("names the product and the offending fields", () => {
    expect(incompleteFormMessage("Acme Pay", ["number", "cvc"])).toContain(
      "Acme Pay"
    );
    expect(incompleteFormMessage("Acme Pay", ["number", "cvc"])).toContain(
      "number, cvc"
    );
  });
});
