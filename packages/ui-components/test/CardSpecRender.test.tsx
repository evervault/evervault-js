/**
 * @vitest-environment jsdom
 */

import { render, waitFor } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { Card } from "../src/Card";
import type { CardConfig } from "../src/Card/types";
import type { CardSpecNode, CardSpecPatchOp } from "types";

vi.mock("@evervault/react", () => ({
  useEvervault: () => ({ encrypt: vi.fn() }),
}));

vi.mock("../src/utilities/useSearchParams", () => ({
  useSearchParams: () => ({ app: "app_test123", id: "frame1" }),
}));

let patch: (payload: { ops: CardSpecPatchOp[] }) => void = () => {};

vi.mock("../src/utilities/useMessaging", () => {
  const messaging = {
    send: vi.fn(),
    on: (type: string, callback: (payload: unknown) => void) => {
      if (type === "EV_SPEC_PATCH") {
        patch = callback as typeof patch;
      }
      return () => {};
    },
  };

  return { useMessaging: () => messaging };
});

function node(
  type: CardSpecNode["type"],
  id: string,
  props: Record<string, string> = {}
): CardSpecNode {
  return { type, id, props };
}

function row(id: string, children: CardSpecNode[]): CardSpecNode {
  return { type: "row", id, props: {}, children };
}

function inserts(nodes: CardSpecNode[]): CardSpecPatchOp[] {
  return nodes.map((node, index) => ({
    op: "insert",
    parentId: null,
    index,
    node,
  }));
}

function apply(ops: CardSpecPatchOp[]) {
  act(() => {
    patch({ ops });
  });
}

function fieldNames(container: HTMLElement) {
  return [...container.querySelectorAll("[ev-name]")].map((field) =>
    field.getAttribute("ev-name")
  );
}

function card(config: CardConfig) {
  return render(<Card config={config} />);
}

describe("Card spec rendering", () => {
  it("renders the default fields when nothing is declared", () => {
    const { container } = card({});

    expect(fieldNames(container)).toEqual(["number", "expiry", "cvc"]);
  });

  it("renders a node tree sent as the fields", () => {
    const { container } = card({
      fields: [node("cvc", "a"), node("number", "b")],
    });

    expect(fieldNames(container)).toEqual(["cvc", "number"]);
  });

  it("renders the fields a patch declares in the declared order", async () => {
    const { container } = card({ fields: [] });

    apply(
      inserts([node("cvc", "a"), node("number", "b"), node("expiry", "c")])
    );

    await waitFor(() =>
      expect(fieldNames(container)).toEqual(["cvc", "number", "expiry"])
    );
  });

  it("renders every declared field type", () => {
    const { container } = card({
      fields: [
        node("name", "a"),
        node("number", "b"),
        node("expiry", "c"),
        node("cvc", "d"),
      ],
    });

    expect(fieldNames(container)).toEqual(["name", "number", "expiry", "cvc"]);
  });

  it("renders the children of a row inside it", () => {
    const { container } = card({
      fields: [
        node("number", "a"),
        row("r", [node("expiry", "b"), node("cvc", "c")]),
      ],
    });

    expect(fieldNames(container)).toEqual(["number", "expiry", "cvc"]);
    expect(
      fieldNames(container.querySelector("[ev-row]") as HTMLElement)
    ).toEqual(["expiry", "cvc"]);
  });

  it("lists the rendered fields on the fieldset", () => {
    const { container } = card({
      fields: [row("r", [node("cvc", "a"), node("number", "b")])],
    });

    expect(container.querySelector("fieldset")?.getAttribute("ev-fields")).toBe(
      "cvc,number"
    );
  });

  it("renders a new tree when the fields are replaced", () => {
    const { container, rerender } = card({
      fields: [node("number", "a")],
    });

    rerender(
      <Card config={{ fields: [node("cvc", "b"), node("number", "a")] }} />
    );

    expect(fieldNames(container)).toEqual(["cvc", "number"]);
  });

  it("renders a new field list when the fields are replaced", () => {
    const { container, rerender } = card({ fields: ["number"] });

    rerender(<Card config={{ fields: ["number", "cvc"] }} />);

    expect(fieldNames(container)).toEqual(["number", "cvc"]);
  });

  it("applies a patch to the tree that replaced the first one", async () => {
    const { container, rerender } = card({ fields: [node("number", "a")] });

    rerender(<Card config={{ fields: [node("cvc", "b")] }} />);
    apply([
      { op: "insert", parentId: null, index: 0, node: node("expiry", "c") },
    ]);

    await waitFor(() =>
      expect(fieldNames(container)).toEqual(["expiry", "cvc"])
    );
  });

  it("keeps the fixed order of the legacy field list", () => {
    const { container } = card({ fields: ["cvc", "number", "expiry"] });

    expect(fieldNames(container)).toEqual(["number", "expiry", "cvc"]);
  });

  it("leaves hidden fields out of the legacy field list", () => {
    const { container } = card({ hiddenFields: "expiry" });

    expect(fieldNames(container)).toEqual(["number", "cvc"]);
  });

  it("renders every field of a node tree regardless of hidden fields", () => {
    const { container } = card({
      fields: [node("number", "a"), node("cvc", "b")],
      hiddenFields: "cvc",
    });

    expect(fieldNames(container)).toEqual(["number", "cvc"]);
  });

  it("renders no field for a node type it cannot render yet", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      const { container } = card({
        fields: [node("number", "a"), node("expiryMonth", "b")],
      });

      expect(fieldNames(container)).toEqual(["number"]);
      expect(warn).toHaveBeenCalledWith(
        '<ev-card> cannot render a "expiryMonth" field yet.'
      );
    } finally {
      warn.mockRestore();
    }
  });

  it("renders a field declared twice once and warns once", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      const { container } = card({
        fields: [node("number", "a"), node("number", "b")],
      });

      expect(fieldNames(container)).toEqual(["number"]);
      expect(warn).toHaveBeenCalledWith(
        '<ev-card> ignored a duplicate "number" field.'
      );
      expect(warn).toHaveBeenCalledTimes(1);

      apply([{ op: "update", id: "b", props: { label: "Again" } }]);

      await waitFor(() => expect(fieldNames(container)).toEqual(["number"]));
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      warn.mockRestore();
    }
  });

  it("warns again when a later patch declares a duplicate", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      const { container } = card({ fields: [node("number", "a")] });

      expect(warn).not.toHaveBeenCalled();

      apply([
        { op: "insert", parentId: null, index: 1, node: node("number", "b") },
      ]);

      await waitFor(() => expect(warn).toHaveBeenCalledTimes(1));
      expect(warn).toHaveBeenCalledWith(
        '<ev-card> ignored a duplicate "number" field.'
      );
      expect(fieldNames(container)).toEqual(["number"]);
    } finally {
      warn.mockRestore();
    }
  });

  it("renders a field declared twice once across a row", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      const { container } = card({
        fields: [
          node("number", "a"),
          row("r", [node("number", "b"), node("cvc", "c")]),
        ],
      });

      expect(fieldNames(container)).toEqual(["number", "cvc"]);
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      warn.mockRestore();
    }
  });

  it("drops a row whose children were all ignored as duplicates", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      const { container } = card({
        fields: [
          node("number", "a"),
          row("r", [node("number", "b")]),
          node("cvc", "c"),
        ],
      });

      expect(fieldNames(container)).toEqual(["number", "cvc"]);
      expect(container.querySelector("[ev-row]")).toBeNull();
    } finally {
      warn.mockRestore();
    }
  });

  it("keeps a typed value when another field is declared", async () => {
    const { container } = card({ fields: [node("number", "a")] });

    const input = container.querySelector<HTMLInputElement>("#number");
    if (!input) throw new Error("no number input");
    input.value = "4242";

    apply([{ op: "insert", parentId: null, index: 1, node: node("cvc", "b") }]);

    await waitFor(() =>
      expect(fieldNames(container)).toEqual(["number", "cvc"])
    );
    expect(container.querySelector<HTMLInputElement>("#number")?.value).toBe(
      "4242"
    );
  });
});
