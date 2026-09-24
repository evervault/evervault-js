/**
 * @vitest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAgentTools } from "../src/Card/useAgentTools";
import type { CardFormValidators } from "../src/Card/agentTools";
import type { CardForm } from "../src/Card/types";
import type { UseFormReturn } from "shared";

const config = {
  namePrefix: "acmepay",
  productName: "Acme Pay",
  exposeTo: ["https://merchant.example", "https://checkout.example"],
};

const validators: CardFormValidators = {
  name: () => undefined,
  number: (v) => (v.number.length === 16 ? undefined : "invalid"),
  expiry: (v) => (v.expiry ? undefined : "invalid"),
  cvc: (v) => (v.cvc.length === 3 ? undefined : "invalid"),
};

function makeForm(values: Partial<CardForm> = {}) {
  return {
    values: { name: "", number: "", expiry: "", cvc: "", ...values },
    errors: null,
    isValid: true,
    validate: vi.fn(),
    setValue: vi.fn(),
    setValues: vi.fn(),
    setError: vi.fn(),
    register: vi.fn(),
  } as unknown as UseFormReturn<CardForm>;
}

type Params = Parameters<typeof useAgentTools>[0];

function baseParams(overrides: Partial<Params> = {}): Params {
  return {
    config,
    fields: ["number", "expiry", "cvc"],
    form: makeForm(),
    validators,
    t: (key: string) => `t:${key}`,
    ...overrides,
  };
}

type Registered = {
  tool: ModelContextTool;
  options: ModelContextRegisterToolOptions;
};

let registered: Registered[];
let registerTool: ReturnType<typeof vi.fn>;

beforeEach(() => {
  registered = [];
  registerTool = vi.fn(
    (tool: ModelContextTool, options: ModelContextRegisterToolOptions) => {
      registered.push({ tool, options });
      return Promise.resolve();
    }
  );
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: { registerTool },
  });
});

afterEach(() => {
  delete (document as { modelContext?: unknown }).modelContext;
  document.body.innerHTML = "";
});

describe("useAgentTools registration", () => {
  it("registers every tool with the configured exposedTo origins", () => {
    renderHook(() => useAgentTools(baseParams()));

    expect(registerTool).toHaveBeenCalledTimes(3);
    for (const { options } of registered) {
      expect(options.exposedTo).toEqual(config.exposeTo);
      expect(options.signal).toBeInstanceOf(AbortSignal);
      expect(options.signal?.aborted).toBe(false);
    }
    expect(registered.map((r) => r.tool.name).sort()).toEqual([
      "acmepay-focus-field",
      "acmepay-get-form-status",
      "acmepay-set-field-value",
    ]);
  });

  it("aborts registration on unmount", () => {
    const { unmount } = renderHook(() => useAgentTools(baseParams()));
    unmount();
    for (const { options } of registered) {
      expect(options.signal?.aborted).toBe(true);
    }
  });

  it("does not re-register when only form state changes", () => {
    const params = baseParams();
    const { rerender } = renderHook((p) => useAgentTools(p), {
      initialProps: params,
    });
    rerender({ ...params, form: makeForm({ number: "4242" }) });
    expect(registerTool).toHaveBeenCalledTimes(3);
  });

  it("re-registers when exposeTo changes", () => {
    const params = baseParams();
    const { rerender } = renderHook((p) => useAgentTools(p), {
      initialProps: params,
    });
    rerender({
      ...params,
      config: { ...config, exposeTo: ["https://other.example"] },
    });
    expect(registerTool).toHaveBeenCalledTimes(6);
    expect(registered[0].options.signal?.aborted).toBe(true);
    expect(registered[5].options.exposedTo).toEqual(["https://other.example"]);
  });

  it("registers nothing when agent tools are not configured", () => {
    renderHook(() => useAgentTools(baseParams({ config: undefined })));
    expect(registerTool).not.toHaveBeenCalled();
  });

  it("registers nothing when the browser lacks WebMCP", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    delete (document as { modelContext?: unknown }).modelContext;
    expect(() => renderHook(() => useAgentTools(baseParams()))).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe("useAgentTools handlers", () => {
  const signal = new AbortController().signal;
  const find = (suffix: string) =>
    registered.find((r) => r.tool.name.endsWith(suffix))!.tool;

  it("reports field status from the latest form values without values", () => {
    const params = baseParams();
    const { rerender } = renderHook((p) => useAgentTools(p), {
      initialProps: params,
    });
    rerender({
      ...params,
      form: makeForm({ number: "4242424242424242", cvc: "12" }),
    });

    const status = find("get-form-status").execute({}, { signal }) as {
      fields: { field: string; hasValue: boolean; isValid: boolean }[];
      isComplete: boolean;
    };

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
      expect.objectContaining({ field: "cvc", hasValue: true, isValid: false }),
    ]);
    expect(JSON.stringify(status)).not.toContain("4242");
  });

  it("sets a field value, validates it, and reports the resulting status", () => {
    const form = makeForm({ number: "4242424242424242", expiry: "0135" });
    renderHook(() => useAgentTools(baseParams({ form })));

    const status = find("set-field-value").execute(
      { field: "cvc", value: "12" },
      { signal }
    ) as { fields: { field: string; isValid: boolean }[]; isComplete: boolean };

    expect(form.setValue).toHaveBeenCalledWith("cvc", "12");
    expect(form.setError).toHaveBeenCalledWith("cvc", "invalid");
    expect(status.isComplete).toBe(false);
    expect(status.fields[2]).toEqual(
      expect.objectContaining({ field: "cvc", hasValue: true, isValid: false })
    );
    expect(JSON.stringify(status)).not.toContain("12");

    const complete = find("set-field-value").execute(
      { field: "cvc", value: "123" },
      { signal }
    ) as { isComplete: boolean };

    expect(form.setError).toHaveBeenLastCalledWith("cvc", undefined);
    expect(complete.isComplete).toBe(true);
  });

  it("focuses the requested field", () => {
    const input = document.createElement("input");
    input.id = "cvc";
    document.body.appendChild(input);
    renderHook(() => useAgentTools(baseParams()));

    expect(find("focus-field").execute({ field: "cvc" }, { signal })).toEqual({
      focused: "cvc",
    });
    expect(document.activeElement).toBe(input);
  });

  it("throws when asked to focus a field that is not rendered", () => {
    renderHook(() => useAgentTools(baseParams()));
    expect(() =>
      find("focus-field").execute({ field: "name" }, { signal })
    ).toThrow('Acme Pay does not show a "name" field.');
  });
});
