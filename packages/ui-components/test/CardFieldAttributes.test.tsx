/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Card } from "../src/Card";
import type { CardConfig } from "../src/Card/types";
import type { CardSpecNode } from "types";
import { apply, input, node, spec, type } from "./helpers/card";

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

function card(config: CardConfig, nodes?: CardSpecNode[]) {
  const { container } = render(
    <Card config={nodes ? { ...config, fields: nodes } : config} />
  );

  return container;
}

function validity(container: HTMLElement, name: string) {
  return container.querySelector(`[ev-name=${name}]`)?.getAttribute("ev-valid");
}

describe("autocomplete", () => {
  it("turns autocomplete off when declared off", async () => {
    const container = card({}, [node("number", "number", { autocomplete: "off" })]);

    expect(input(container, "number").autocomplete).toBe("off");
  });

  it("turns autocomplete off from the config when not declared", async () => {
    const container = card({ autoComplete: { number: false } });

    expect(input(container, "number").autocomplete).toBe("off");
  });

  it("prefers the declared autocomplete over the config", async () => {
    const container = card({ autoComplete: { number: false } }, [
      node("number", "number", { autocomplete: "" }),
    ]);

    expect(input(container, "number").autocomplete).toBe("billing cc-number");
  });

  it("turns autocomplete off on every field type", async () => {
    const container = card({}, [
      node("name", "name", { autocomplete: "off" }),
      node("number", "number", { autocomplete: "off" }),
      node("expiry", "expiry", { autocomplete: "off" }),
      node("cvc", "cvc", { autocomplete: "off" }),
    ]);

    expect(input(container, "name").autocomplete).toBe("off");
    expect(input(container, "number").autocomplete).toBe("off");
    expect(input(container, "expiry").autocomplete).toBe("off");
    expect(input(container, "cvc").autocomplete).toBe("off");
  });
});

describe("autofocus", () => {
  it("focuses the field declaring autofocus", async () => {
    const container = card({}, [
      node("number"),
      node("cvc", "cvc", { autofocus: "" }),
    ]);

    expect(document.activeElement).toBe(input(container, "cvc"));
  });

  it("focuses the first field declaring autofocus", async () => {
    const container = card({}, [
      node("number", "number", { autofocus: "" }),
      node("cvc", "cvc", { autofocus: "" }),
    ]);

    expect(document.activeElement).toBe(input(container, "number"));
  });

  it("focuses from the config when no field declares autofocus", async () => {
    const container = card({ autoFocus: true });

    expect(document.activeElement).toBe(input(container, "number"));
  });

  it("prefers the declared autofocus over the config", async () => {
    const container = card({ autoFocus: true }, [
      node("number"),
      node("expiry", "expiry", { autofocus: "" }),
    ]);

    expect(document.activeElement).toBe(input(container, "expiry"));
  });

  it("focuses nothing when the only declaration is autofocus=false", async () => {
    const container = card({ autoFocus: true }, [
      node("number", "number", { autofocus: "false" }),
      node("cvc"),
    ]);

    expect(document.activeElement).not.toBe(input(container, "number"));
    expect(document.activeElement).not.toBe(input(container, "cvc"));
  });

  it("keeps the config focus for a card declaring no autofocus at all", async () => {
    const container = card({ autoFocus: true }, [node("number"), node("cvc")]);

    expect(document.activeElement).toBe(input(container, "number"));
  });

  it("leaves focus alone once the customer has typed", async () => {
    const container = card({}, [
      node("number", "number", { autofocus: "" }),
      node("expiry"),
      node("cvc", "cvc", { autofocus: "" }),
    ]);

    expect(document.activeElement).toBe(input(container, "number"));

    const expiry = input(container, "expiry");
    type(expiry, "12");

    apply([{ op: "remove", id: "number" }]);

    await waitFor(() => expect(container.querySelector("#number")).toBeNull());
    expect(document.activeElement).toBe(expiry);
  });

  it("focuses a re-declared field while the customer has done nothing", async () => {
    const container = card({}, [
      node("number", "number", { autofocus: "" }),
      node("cvc"),
    ]);

    expect(document.activeElement).toBe(input(container, "number"));

    apply([{ op: "remove", id: "number" }]);

    await waitFor(() => expect(container.querySelector("#number")).toBeNull());

    apply([
      {
        op: "insert",
        parentId: null,
        index: 0,
        node: node("number", "number", { autofocus: "" }),
      },
    ]);

    await waitFor(() =>
      expect(document.activeElement).toBe(input(container, "number"))
    );
  });
});

describe("redact", () => {
  it("redacts the security code when declared", async () => {
    const container = card({}, [node("cvc", "cvc", { redact: "" })]);

    expect(input(container, "cvc").type).toBe("password");
  });

  it("redacts the security code from the config when not declared", async () => {
    const container = card({ redactCVC: true }, [node("cvc")]);

    expect(input(container, "cvc").type).toBe("password");
  });

  it("prefers the declared redact over the config", async () => {
    const container = card({ redactCVC: true }, [
      node("cvc", "cvc", { redact: "false" }),
    ]);

    expect(input(container, "cvc").type).toBe("text");
  });
});

describe("optional", () => {
  it("accepts an empty security code when declared optional", async () => {
    const container = card({}, [node("number"), node("cvc", "cvc", { optional: "" })]);

    fireEvent.blur(input(container, "cvc"));

    await waitFor(() => expect(validity(container, "cvc")).toBe("true"));
  });

  it("accepts an empty security code from the config when not declared", async () => {
    const container = card({ validation: { cvc: { optional: true } } });

    fireEvent.blur(input(container, "cvc"));

    await waitFor(() => expect(validity(container, "cvc")).toBe("true"));
  });

  it("prefers the declared optional over the config", async () => {
    const container = card({ validation: { cvc: { optional: true } } }, [
      node("number"),
      node("cvc", "cvc", { optional: "false" }),
    ]);

    fireEvent.blur(input(container, "cvc"));

    await waitFor(() => expect(validity(container, "cvc")).toBe("false"));
  });
});

describe("default-value", () => {
  it("fills the card holder with the declared default value", async () => {
    const container = card({}, [node("name", "name", { "default-value": "Jane Doe" })]);

    await waitFor(() =>
      expect(input(container, "name").value).toBe("Jane Doe")
    );
  });

  it("fills the card holder from the config when not declared", async () => {
    const container = card({
      fields: ["name"],
      defaultValues: { name: "Jane Doe" },
    });

    expect(input(container, "name").value).toBe("Jane Doe");
  });

  it("prefers the declared default value over the config", async () => {
    const container = card({ defaultValues: { name: "From config" } }, [
      node("name", "name", { "default-value": "Jane Doe" }),
    ]);

    await waitFor(() =>
      expect(input(container, "name").value).toBe("Jane Doe")
    );
  });

  it("reports no change of its own for a seeded default value", async () => {
    const container = card({}, [node("name", "name", { "default-value": "Jane Doe" })]);

    await waitFor(() =>
      expect(input(container, "name").value).toBe("Jane Doe")
    );

    expect(send).not.toHaveBeenCalledWith("EV_CHANGE", expect.anything());
  });

  it("takes a new default value while the customer has typed nothing", async () => {
    const container = card({}, [node("name", "name", { "default-value": "Jane Doe" })]);

    await waitFor(() =>
      expect(input(container, "name").value).toBe("Jane Doe")
    );

    apply([
      { op: "update", id: "name", props: { "default-value": "Jane A Doe" } },
    ]);

    await waitFor(() =>
      expect(input(container, "name").value).toBe("Jane A Doe")
    );
  });

  it("keeps the typed name when the default value changes", async () => {
    const container = card({}, [node("name", "name", { "default-value": "Jane Doe" })]);

    await waitFor(() =>
      expect(input(container, "name").value).toBe("Jane Doe")
    );

    const name = input(container, "name");
    name.focus();
    fireEvent.change(name, { target: { value: "John Smith" } });

    await waitFor(() =>
      expect(input(container, "name").value).toBe("John Smith")
    );

    apply([
      { op: "update", id: "name", props: { "default-value": "Jane A Doe" } },
    ]);

    await waitFor(() =>
      expect(input(container, "name").value).toBe("John Smith")
    );
  });
});
