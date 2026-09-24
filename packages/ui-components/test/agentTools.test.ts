import { describe, expect, it, vi } from "vitest";
import {
  buildAgentTools,
  buildFieldStatuses,
  normalizeFieldValue,
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

describe("normalizeFieldValue", () => {
  it("keeps only digits for number and cvc", () => {
    expect(normalizeFieldValue("number", "4242 4242-4242 4242")).toBe(
      "4242424242424242"
    );
    expect(normalizeFieldValue("cvc", " 123 ")).toBe("123");
  });

  it("reduces expiry to MMYY", () => {
    expect(normalizeFieldValue("expiry", "01/35")).toBe("0135");
    expect(normalizeFieldValue("expiry", "01 / 35")).toBe("0135");
    expect(normalizeFieldValue("expiry", "01/2035")).toBe("0135");
    expect(normalizeFieldValue("expiry", "0135")).toBe("0135");
  });

  it("trims the cardholder name", () => {
    expect(normalizeFieldValue("name", "  Ada Lovelace ")).toBe("Ada Lovelace");
  });
});

describe("buildAgentTools", () => {
  const status = { fields: [], isComplete: false, focusedField: null };
  const handlers = {
    getStatus: vi.fn(() => status),
    focusField: vi.fn((field) => ({ focused: field })),
    setFieldValue: vi.fn(() => status),
  };

  const tools = buildAgentTools(config, ["number", "expiry", "cvc"], handlers);
  const signal = new AbortController().signal;

  it("prefixes tool names and brands descriptions with the product name", () => {
    expect(tools.map((tool) => tool.name)).toEqual([
      "acmepay-get-form-status",
      "acmepay-focus-field",
      "acmepay-set-field-value",
    ]);
    for (const tool of tools) {
      expect(tool.description).toContain("Acme Pay");
      expect(tool.description.toLowerCase()).not.toContain("evervault");
    }
  });

  it("marks the status tool as read-only", () => {
    expect(tools[0].annotations?.readOnlyHint).toBe(true);
  });

  it("limits focusable fields to the rendered ones", () => {
    const schema = tools[1].inputSchema as {
      properties: { field: { enum: string[] } };
    };
    expect(schema.properties.field.enum).toEqual(["number", "expiry", "cvc"]);

    expect(() => tools[1].execute({ field: "name" }, { signal })).toThrow(
      'Acme Pay does not show a "name" field.'
    );
    expect(tools[1].execute({ field: "cvc" }, { signal })).toEqual({
      focused: "cvc",
    });
  });

  it("normalises values before handing them to the form", () => {
    tools[2].execute({ field: "expiry", value: "01 / 35" }, { signal });
    expect(handlers.setFieldValue).toHaveBeenCalledWith("expiry", "0135");

    tools[2].execute(
      { field: "number", value: "4242 4242 4242 4242" },
      { signal }
    );
    expect(handlers.setFieldValue).toHaveBeenCalledWith(
      "number",
      "4242424242424242"
    );
  });

  it("rejects unknown fields and non-string values", () => {
    expect(() =>
      tools[2].execute({ field: "name", value: "x" }, { signal })
    ).toThrow('Acme Pay does not show a "name" field.');
    expect(() =>
      tools[2].execute({ field: "cvc", value: 123 }, { signal })
    ).toThrow('Acme Pay expects a string value for the "cvc" field.');
  });
});
