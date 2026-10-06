import userEvent from "@testing-library/user-event";
/**
 * @vitest-environment jsdom
 */

import {
  createEvent,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Card } from "../src/Card";
import {
  COMBINED_EXPIRY_WITH_HALF,
  duplicateField,
  loneExpiryHalf,
} from "../src/Card/developerMessages";
import { DEFAULT_TRANSLATIONS } from "../src/Card/translations";
import type { CardConfig } from "../src/Card/types";
import type { CardSpecNode } from "types";
import { apply, fieldNames, input, node, settle, spec } from "./helpers/card";

vi.mock("@evervault/react", () => ({
  useEvervault: () => ({ encrypt: vi.fn() }),
}));

vi.mock("../src/utilities/useSearchParams", () => ({
  useSearchParams: () => ({ app: "app_test123", id: "frame1" }),
}));

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("../src/utilities/useMessaging", () => ({
  useMessaging: () => ({
    send,
    on: (type: string, callback: (payload: unknown) => void) => {
      if (type === "EV_SPEC_PATCH") {
        spec.patch = callback as typeof spec.patch;
      }
      return () => {};
    },
  }),
}));

beforeEach(() => {
  send.mockClear();
});

function card(nodes: CardSpecNode[], config: CardConfig = {}) {
  const { container } = render(<Card config={{ ...config, fields: nodes }} />);

  return container;
}

function field(container: HTMLElement, name: string) {
  const found = container.querySelector(`[ev-name=${name}]`);
  if (!found) throw new Error(`no ${name} field`);
  return found;
}

function errors(container: HTMLElement, name: string) {
  return [...field(container, name).querySelectorAll(".error")].map(
    (error) => error.textContent
  );
}

function backspace(element: HTMLInputElement) {
  const event = createEvent.keyDown(element, { key: "Backspace" });
  fireEvent(element, event);
  return event;
}

function lastChange() {
  const calls = send.mock.calls.filter(([type]) => type === "EV_CHANGE");
  return calls[calls.length - 1]?.[1] as
    | { card: { expiry: { month: string | null; year: string | null } } }
    | undefined;
}

const INVALID = DEFAULT_TRANSLATIONS.expiry.errors?.invalid;

const SPLIT = [
  node("number"),
  node("expiryMonth"),
  node("expiryYear"),
  node("cvc"),
];

describe("split expiry rendering", () => {
  it("renders an input for each half", () => {
    const container = card(SPLIT);

    expect(input(container, "expiry-month").name).toBe("expiry-month");
    expect(input(container, "expiry-year").name).toBe("expiry-year");
    expect(container.querySelector("#expiry")).toBeNull();
  });

  it("names the fields after their half", () => {
    const container = card(SPLIT);

    expect(fieldNames(container)).toEqual([
      "number",
      "expiry-month",
      "expiry-year",
      "cvc",
    ]);
  });

  it("lists the expiry once among the card fields", () => {
    const container = card(SPLIT);

    expect(
      container.querySelector("[ev-component=card]")?.getAttribute("ev-fields")
    ).toBe("number,expiry,cvc");
  });

  it("labels each half by default", () => {
    const container = card(SPLIT);

    expect(
      field(container, "expiry-month").querySelector("label")?.textContent
    ).toBe("Expiration Month");
    expect(
      field(container, "expiry-year").querySelector("label")?.textContent
    ).toBe("Expiration Year");
    expect(input(container, "expiry-month").placeholder).toBe("MM");
    expect(input(container, "expiry-year").placeholder).toBe("YY");
  });

  it("takes the label and placeholder declared on a half", () => {
    const container = card([
      node("expiryMonth", "expiryMonth", { label: "Month", placeholder: "00" }),
      node("expiryYear", "expiryYear", { label: "Year" }),
    ]);

    expect(
      field(container, "expiry-month").querySelector("label")?.textContent
    ).toBe("Month");
    expect(input(container, "expiry-month").placeholder).toBe("00");
    expect(
      field(container, "expiry-year").querySelector("label")?.textContent
    ).toBe("Year");
  });

  it("takes the label for a half from the translations", () => {
    const container = card(SPLIT, {
      translations: { expiryYear: { label: "Ano" } },
    });

    expect(
      field(container, "expiry-year").querySelector("label")?.textContent
    ).toBe("Ano");
  });

  it("fills each half with the browser's own expiry token", () => {
    const container = card(SPLIT);

    expect(input(container, "expiry-month").autocomplete).toBe(
      "billing cc-exp-month"
    );
    expect(input(container, "expiry-year").autocomplete).toBe(
      "billing cc-exp-year"
    );
  });

  it("renders a duplicate half once and warns", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      const container = card([
        node("expiryMonth"),
        node("expiryMonth", "again"),
        node("expiryYear"),
      ]);

      expect(container.querySelectorAll("#expiry-month")).toHaveLength(1);
      expect(warn).toHaveBeenCalledWith(duplicateField("expiryMonth"));
    } finally {
      warn.mockRestore();
    }
  });
});

describe("split expiry declaration", () => {
  const LONE_MONTH = loneExpiryHalf("expiryMonth");

  it("renders nothing and logs why for a month without a year", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const container = card([node("number"), node("expiryMonth")]);

      expect(fieldNames(container)).toEqual([]);
      expect(error).toHaveBeenCalledWith(LONE_MONTH);
    } finally {
      error.mockRestore();
    }
  });

  it("logs why for the combined field alongside the halves", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      card([node("expiry"), node("expiryMonth"), node("expiryYear")]);

      expect(error).toHaveBeenCalledWith(COMBINED_EXPIRY_WITH_HALF);
    } finally {
      error.mockRestore();
    }
  });

  it("keeps the last tree it rendered when a patch leaves a lone half", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const container = card(SPLIT);

      apply([{ op: "remove", id: "expiryYear" }]);

      expect(fieldNames(container)).toEqual([
        "number",
        "expiry-month",
        "expiry-year",
        "cvc",
      ]);
      expect(error).toHaveBeenCalledWith(LONE_MONTH);
    } finally {
      error.mockRestore();
    }
  });

  it("renders the tree once a patch makes it whole again", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const container = card([node("number"), node("expiryMonth")]);

      apply([
        { op: "insert", parentId: null, index: 2, node: node("expiryYear") },
      ]);

      expect(fieldNames(container)).toEqual([
        "number",
        "expiry-month",
        "expiry-year",
      ]);
    } finally {
      error.mockRestore();
    }
  });
});

describe("split expiry value", () => {
  it("reports the two halves as one expiry", async () => {
    const container = card(SPLIT);

    await userEvent.type(input(container, "expiry-month"), "12");
    await userEvent.type(input(container, "expiry-year"), "35");

    await waitFor(() =>
      expect(lastChange()?.card.expiry).toEqual({ month: "12", year: "35" })
    );
  });

  it("keeps a year typed ahead of the month", async () => {
    const container = card(SPLIT);

    await userEvent.type(input(container, "expiry-year"), "35");
    await userEvent.type(input(container, "expiry-month"), "12");

    await waitFor(() =>
      expect(lastChange()?.card.expiry).toEqual({ month: "12", year: "35" })
    );
    expect(input(container, "expiry-year").value).toBe("35");
  });

  it("reports no year while the month is incomplete", async () => {
    const container = card(SPLIT);

    await userEvent.type(input(container, "expiry-year"), "35");

    await waitFor(() => expect(lastChange()).toBeDefined());
    expect(lastChange()?.card.expiry).toEqual({ month: null, year: null });
  });

  it("carries a typed date over to the halves when the form switches", async () => {
    const container = card([node("number"), node("expiry")]);

    await userEvent.type(input(container, "expiry"), "1235");

    await waitFor(() =>
      expect(lastChange()?.card.expiry).toEqual({ month: "12", year: "35" })
    );

    apply([
      { op: "remove", id: "expiry" },
      { op: "insert", parentId: null, index: 1, node: node("expiryMonth") },
      { op: "insert", parentId: null, index: 2, node: node("expiryYear") },
    ]);

    await waitFor(() =>
      expect(input(container, "expiry-month").value).toBe("12")
    );
    expect(input(container, "expiry-year").value).toBe("35");
  });
});

describe("split expiry validation", () => {
  it("marks both halves invalid for an expired date", async () => {
    const container = card(SPLIT);

    await userEvent.type(input(container, "expiry-month"), "12");
    await userEvent.type(input(container, "expiry-year"), "20");
    fireEvent.blur(input(container, "expiry-year"));

    await waitFor(() =>
      expect(field(container, "expiry-year").getAttribute("ev-valid")).toBe(
        "false"
      )
    );
    expect(field(container, "expiry-month").getAttribute("ev-valid")).toBe(
      "false"
    );
  });

  it("renders the error under the half declared later", async () => {
    const container = card(SPLIT);

    await userEvent.type(input(container, "expiry-month"), "12");
    await userEvent.type(input(container, "expiry-year"), "20");
    fireEvent.blur(input(container, "expiry-year"));

    await waitFor(() =>
      expect(errors(container, "expiry-year")).toEqual([INVALID])
    );
    expect(errors(container, "expiry-month")).toEqual([]);
  });

  it("renders the error under the month when it is declared after the year", async () => {
    const container = card([
      node("number"),
      node("expiryYear"),
      node("expiryMonth"),
    ]);

    await userEvent.type(input(container, "expiry-year"), "20");
    await userEvent.type(input(container, "expiry-month"), "12");
    fireEvent.blur(input(container, "expiry-month"));

    await waitFor(() =>
      expect(errors(container, "expiry-month")).toEqual([INVALID])
    );
    expect(errors(container, "expiry-year")).toEqual([]);
  });

  it("does not judge the date when a half is left for the empty other half", async () => {
    const container = card(SPLIT);

    await userEvent.type(input(container, "expiry-month"), "12");
    input(container, "expiry-year").focus();

    await settle();
    expect(field(container, "expiry-month").getAttribute("ev-valid")).toBe(
      "true"
    );
    expect(errors(container, "expiry-year")).toEqual([]);
  });

  it("does not judge the date when the later half is left for the empty earlier half", async () => {
    const container = card(SPLIT);

    await userEvent.type(input(container, "expiry-year"), "35");
    input(container, "expiry-month").focus();

    await settle();
    expect(field(container, "expiry-year").getAttribute("ev-valid")).toBe(
      "true"
    );
  });

  it("judges the date when a half is left for another field with the other half empty", async () => {
    const container = card(SPLIT);

    await userEvent.type(input(container, "expiry-month"), "12");
    input(container, "cvc").focus();

    await waitFor(() =>
      expect(errors(container, "expiry-year")).toEqual([INVALID])
    );
  });

  it("judges the date when the first half is left with the second filled", async () => {
    const container = card(SPLIT);

    await userEvent.type(input(container, "expiry-year"), "20");
    await userEvent.type(input(container, "expiry-month"), "12");
    fireEvent.blur(input(container, "expiry-month"));

    await waitFor(() =>
      expect(errors(container, "expiry-year")).toEqual([INVALID])
    );
  });

  it("clears the error once the date is valid", async () => {
    const container = card(SPLIT);

    await userEvent.type(input(container, "expiry-month"), "12");
    await userEvent.type(input(container, "expiry-year"), "20");
    fireEvent.blur(input(container, "expiry-year"));

    await waitFor(() =>
      expect(errors(container, "expiry-year")).toEqual([INVALID])
    );

    await userEvent.clear(input(container, "expiry-year"));
    await userEvent.type(input(container, "expiry-year"), "35");

    await waitFor(() => expect(errors(container, "expiry-year")).toEqual([]));
    expect(field(container, "expiry-month").getAttribute("ev-valid")).toBe(
      "true"
    );
  });
});

describe("split expiry focus", () => {
  it("advances from the month to the year and on to the next input", async () => {
    const container = card(SPLIT, { autoProgress: true });

    await userEvent.type(input(container, "expiry-month"), "12");

    await waitFor(() => expect(document.activeElement?.id).toBe("expiry-year"));

    await userEvent.type(input(container, "expiry-year"), "35");

    await waitFor(() => expect(document.activeElement?.id).toBe("cvc"));
  });

  it("advances into the halves in their declared order", async () => {
    const container = card(
      [node("number"), node("expiryYear"), node("expiryMonth"), node("cvc")],
      { autoProgress: true }
    );

    await userEvent.type(input(container, "number"), "4242424242424242");

    await waitFor(() => expect(document.activeElement?.id).toBe("expiry-year"));

    await userEvent.type(input(container, "expiry-year"), "35");

    await waitFor(() =>
      expect(document.activeElement?.id).toBe("expiry-month")
    );
  });

  it("steps back from an empty year to the month", async () => {
    const container = card(SPLIT, { autoProgress: true });
    const year = input(container, "expiry-year");

    year.focus();
    const event = backspace(year);

    expect(document.activeElement?.id).toBe("expiry-month");
    expect(event.defaultPrevented).toBe(true);
  });

  it("focuses a half declaring autofocus", () => {
    const container = card([
      node("number"),
      node("expiryMonth"),
      node("expiryYear", "expiryYear", { autofocus: "" }),
    ]);

    expect(document.activeElement).toBe(input(container, "expiry-year"));
  });

  it("reports focus on the halves as the expiry field", () => {
    const container = card(SPLIT);

    input(container, "expiry-month").focus();
    input(container, "expiry-year").focus();

    expect(send).toHaveBeenCalledWith("EV_FOCUS", "expiry");
    expect(send).toHaveBeenCalledWith("EV_BLUR", "expiry");
    expect(send).not.toHaveBeenCalledWith("EV_FOCUS", "expiry-month");
  });
});

describe("split expiry written from outside the halves", () => {
  it("fills the halves from a swiped card", async () => {
    const container = card(SPLIT);

    for (const key of ";4242424242424242=351210100000?") {
      fireEvent.keyDown(document, { key });
    }

    await waitFor(() =>
      expect(input(container, "expiry-month").value).toBe("12")
    );
    expect(input(container, "expiry-year").value).toBe("35");
  });

  it("fills the halves from an agent setting the expiry", async () => {
    const tools: { name: string; execute: (input: unknown) => unknown }[] = [];
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool: (tool: (typeof tools)[number]) => {
          tools.push(tool);
          return Promise.resolve();
        },
      },
    });

    try {
      const container = card(SPLIT, {
        agentTools: { namePrefix: "acme", productName: "Acme", exposeTo: [] },
      });
      const setFieldValue = tools.find((tool) =>
        tool.name.endsWith("set-field-value")
      );

      act(() => {
        setFieldValue?.execute({ field: "expiry", value: "12/35" });
      });

      await waitFor(() =>
        expect(input(container, "expiry-month").value).toBe("12")
      );
      expect(input(container, "expiry-year").value).toBe("35");
    } finally {
      delete (document as { modelContext?: unknown }).modelContext;
    }
  });
});
