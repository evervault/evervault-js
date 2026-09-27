/**
 * @vitest-environment jsdom
 */

import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Card } from "../src/Card";
import type { CardConfig } from "../src/Card/types";
import type { CardPayload, CardSpecNode } from "types";
import { apply, field, input, node, settle, spec } from "./helpers/card";

const { encrypt, send, validate } = vi.hoisted(() => ({
  encrypt: vi.fn(async (value: string) => `encrypted(${value})`),
  send: vi.fn(),
  validate: { request: () => {} },
}));

vi.mock("@evervault/react", () => ({
  useEvervault: () => ({ encrypt }),
}));

vi.mock("../src/utilities/useSearchParams", () => ({
  useSearchParams: () => ({ app: "app_test123", id: "frame1" }),
}));

vi.mock("../src/utilities/useMessaging", () => ({
  useMessaging: () => ({
    send,
    on: (type: string, callback: (payload: unknown) => void) => {
      if (type === "EV_SPEC_PATCH") {
        spec.patch = callback as typeof spec.patch;
      }
      if (type === "EV_VALIDATE") {
        validate.request = callback as () => void;
      }
      return () => {};
    },
  }),
}));

beforeEach(() => {
  send.mockClear();
  encrypt.mockClear();
});

function card(nodes: CardSpecNode[], config: CardConfig = {}) {
  const { container } = render(<Card config={{ ...config, fields: nodes }} />);

  return container;
}

function sent(message: string): CardPayload[] {
  return send.mock.calls
    .filter(([type]) => type === message)
    .map(([, payload]) => payload as CardPayload);
}

function lastChange() {
  return sent("EV_CHANGE").at(-1);
}

describe("<ev-field> values", () => {
  it("reports a typed value encrypted, under the field's name", async () => {
    const container = card([field("postcode", { name: "postcode" })]);

    await userEvent.type(input(container, "field-postcode"), "SW1A 1AA");

    await waitFor(() =>
      expect(lastChange()?.fields).toEqual({
        postcode: "encrypted(SW1A 1AA)",
      })
    );
    expect(encrypt).toHaveBeenCalledWith("SW1A 1AA");
  });

  it("never reports a typed value in plaintext", async () => {
    const container = card([
      node("number"),
      field("postcode", { name: "postcode" }),
    ]);

    await userEvent.type(input(container, "field-postcode"), "SW1A 1AA");

    await waitFor(() => expect(lastChange()).toBeDefined());

    const reported = JSON.stringify(send.mock.calls).replaceAll(
      "encrypted(SW1A 1AA)",
      ""
    );
    expect(reported).not.toContain("SW1A 1AA");
  });

  it("reports an empty field as null", async () => {
    const container = card([
      field("postcode", { name: "postcode" }),
      field("nickname", { name: "nickname" }),
    ]);

    await userEvent.type(input(container, "field-postcode"), "SW1A 1AA");

    await waitFor(() =>
      expect(lastChange()?.fields).toEqual({
        postcode: "encrypted(SW1A 1AA)",
        nickname: null,
      })
    );
  });

  it("reports a field emptied again as null", async () => {
    const container = card([field("postcode", { name: "postcode" })]);

    await userEvent.type(input(container, "field-postcode"), "SW1A 1AA");
    await waitFor(() => expect(lastChange()).toBeDefined());

    await userEvent.clear(input(container, "field-postcode"));

    await waitFor(() =>
      expect(lastChange()?.fields).toEqual({ postcode: null })
    );
  });

  it("reports the fields alongside a change to the card", async () => {
    const container = card([
      node("name"),
      field("postcode", { name: "postcode" }),
    ]);

    await userEvent.type(input(container, "field-postcode"), "SW1A 1AA");
    await waitFor(() => expect(lastChange()).toBeDefined());

    await userEvent.type(input(container, "name"), "Jane Doe");

    await waitFor(() => expect(lastChange()?.card.name).toBe("Jane Doe"));
    expect(lastChange()?.fields).toEqual({ postcode: "encrypted(SW1A 1AA)" });
  });

  it("stops reporting a field that leaves the tree", async () => {
    const container = card([
      node("name"),
      field("postcode", { name: "postcode" }),
    ]);

    await userEvent.type(input(container, "field-postcode"), "SW1A 1AA");
    await waitFor(() => expect(lastChange()).toBeDefined());

    apply([{ op: "remove", id: "postcode" }]);
    await userEvent.type(input(container, "name"), "Jane Doe");

    await waitFor(() => expect(lastChange()?.card.name).toBe("Jane Doe"));
    expect(lastChange()?.fields).toEqual({});
  });

  it("reports no change of its own for a seeded default value", async () => {
    const container = card([
      field("postcode", { name: "postcode", defaultvalue: "SW1A 1AA" }),
    ]);

    await waitFor(() =>
      expect(input(container, "field-postcode").value).toBe("SW1A 1AA")
    );
    await settle();

    expect(sent("EV_CHANGE")).toHaveLength(0);
  });

  it("reports the fields when the card is validated", async () => {
    const container = card([field("postcode", { name: "postcode" })]);

    await userEvent.type(input(container, "field-postcode"), "SW1A 1AA");
    await waitFor(() => expect(lastChange()).toBeDefined());

    act(() => validate.request());

    await waitFor(() =>
      expect(sent("EV_VALIDATED").at(-1)?.fields).toEqual({
        postcode: "encrypted(SW1A 1AA)",
      })
    );
  });

  it("reports no fields for a card that declares none", async () => {
    const { container } = render(<Card config={{ fields: ["name"] }} />);

    await userEvent.type(input(container, "name"), "Jane Doe");

    await waitFor(() => expect(lastChange()?.fields).toEqual({}));
  });
});
