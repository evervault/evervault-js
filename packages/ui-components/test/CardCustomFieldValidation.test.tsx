/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Card } from "../src/Card";
import { DEFAULT_TRANSLATIONS } from "../src/Card/translations";
import type { CardConfig } from "../src/Card/types";
import type { CardPayload, CardSpecNode } from "types";
import { apply, field, input, node, settle, spec } from "./helpers/card";

const REQUIRED = DEFAULT_TRANSLATIONS.field?.errors?.required;
const INVALID = DEFAULT_TRANSLATIONS.field?.errors?.invalid;

const { send, validate } = vi.hoisted(() => ({
  send: vi.fn(),
  validate: { request: () => {} },
}));

vi.mock("@evervault/react", () => ({
  useEvervault: () => ({
    encrypt: async (value: string) => `encrypted(${value})`,
  }),
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
});

const POSTCODE = "^[A-Z]{1,2}\\d[A-Z\\d]? ?\\d[A-Z]{2}$";

function card(nodes: CardSpecNode[], config: CardConfig = {}) {
  const { container } = render(<Card config={{ ...config, fields: nodes }} />);

  return container;
}

function postcodeCard(props: Record<string, string> = {}) {
  return card([field("postcode", { name: "postcode", ...props })]);
}

function lastSent(message: string) {
  return send.mock.calls.filter(([type]) => type === message).at(-1)?.[1] as
    | CardPayload
    | undefined;
}

function errorText(container: HTMLElement) {
  return container.querySelector("[ev-name=field-postcode] .error")
    ?.textContent;
}

function validity(container: HTMLElement) {
  return container
    .querySelector("[ev-name=field-postcode]")
    ?.getAttribute("ev-valid");
}

function leave(element: HTMLInputElement) {
  fireEvent.blur(element);
}

describe("<ev-field> validation", () => {
  it("shows no error before the field is left", async () => {
    const container = postcodeCard({ pattern: POSTCODE });

    await userEvent.type(input(container, "field-postcode"), "123");

    expect(validity(container)).toBe("true");
    expect(errorText(container)).toBeUndefined();
  });

  it("shows an error for a value not matching the pattern once left", async () => {
    const container = postcodeCard({ pattern: POSTCODE });
    const postcode = input(container, "field-postcode");

    await userEvent.type(postcode, "123");
    leave(postcode);

    await waitFor(() => expect(validity(container)).toBe("false"));
    expect(errorText(container)).toBe(INVALID);
    expect(postcode.getAttribute("aria-invalid")).toBe("true");
  });

  it("clears the error as soon as the value is valid", async () => {
    const container = postcodeCard({ pattern: POSTCODE });
    const postcode = input(container, "field-postcode");

    await userEvent.type(postcode, "123");
    leave(postcode);
    await waitFor(() => expect(validity(container)).toBe("false"));

    await userEvent.clear(postcode);
    await userEvent.type(postcode, "SW1A 1AA");

    await waitFor(() => expect(validity(container)).toBe("true"));
  });

  it("shows the required error for an empty required field once left", async () => {
    const container = postcodeCard({ required: "" });

    leave(input(container, "field-postcode"));

    await waitFor(() => expect(errorText(container)).toBe(REQUIRED));
  });

  it("marks a required field as required", () => {
    const container = postcodeCard({ required: "" });

    expect(
      input(container, "field-postcode").getAttribute("aria-required")
    ).toBe("true");
  });

  it("shows the declared error message in place of the default", async () => {
    const container = postcodeCard({
      pattern: POSTCODE,
      errormessage: "Enter a UK postcode",
    });
    const postcode = input(container, "field-postcode");

    await userEvent.type(postcode, "123");
    leave(postcode);

    await waitFor(() =>
      expect(errorText(container)).toBe("Enter a UK postcode")
    );
  });

  it("marks the card invalid while a field shows an error", async () => {
    const container = postcodeCard({ pattern: POSTCODE });
    const postcode = input(container, "field-postcode");

    await userEvent.type(postcode, "123");
    leave(postcode);

    await waitFor(() =>
      expect(
        container.querySelector("[ev-component=card]")?.getAttribute("ev-valid")
      ).toBe("false")
    );
  });

  it("leaves the card number's own validation to the card number", async () => {
    const container = card([node("number", "number", { pattern: ".*" })]);
    const number = input(container, "number");

    await userEvent.type(number, "4242");
    leave(number);

    await waitFor(() =>
      expect(
        container.querySelector("[ev-name=number]")?.getAttribute("ev-valid")
      ).toBe("false")
    );
  });
});

describe("<ev-field> validation in the payload", () => {
  it("reports an invalid value as null, with its error", async () => {
    const container = postcodeCard({ pattern: POSTCODE });
    const postcode = input(container, "field-postcode");

    await userEvent.type(postcode, "123");
    leave(postcode);

    await waitFor(() =>
      expect(lastSent("EV_CHANGE")?.errors).toEqual({
        fields: { postcode: "invalid" },
      })
    );
    expect(lastSent("EV_CHANGE")?.fields).toEqual({ postcode: null });
    expect(lastSent("EV_CHANGE")?.isValid).toBe(false);
  });

  it("reports an invalid value as null before the field is left", async () => {
    const container = postcodeCard({ pattern: POSTCODE });

    await userEvent.type(input(container, "field-postcode"), "123");

    await waitFor(() =>
      expect(lastSent("EV_CHANGE")?.fields).toEqual({ postcode: null })
    );
    expect(lastSent("EV_CHANGE")?.errors).toBeNull();
  });

  it("keeps the card's own errors beside the field errors", async () => {
    const container = card([
      node("number"),
      field("postcode", { name: "postcode", pattern: POSTCODE }),
    ]);
    const number = input(container, "number");
    const postcode = input(container, "field-postcode");

    await userEvent.type(number, "4242");
    leave(number);
    await userEvent.type(postcode, "123");
    leave(postcode);

    await waitFor(() =>
      expect(lastSent("EV_CHANGE")?.errors).toEqual({
        number: "invalid",
        fields: { postcode: "invalid" },
      })
    );
  });

  it("is not complete while a required field is empty", async () => {
    const container = card([
      node("name"),
      field("postcode", { name: "postcode", required: "" }),
    ]);

    await userEvent.type(input(container, "name"), "Jane Doe");

    await waitFor(() => expect(lastSent("EV_CHANGE")).toBeDefined());
    expect(lastSent("EV_CHANGE")?.isComplete).toBe(false);
  });

  it("is complete once every field is valid", async () => {
    const container = card([
      node("name"),
      field("postcode", {
        name: "postcode",
        required: "",
        pattern: POSTCODE,
      }),
    ]);

    await userEvent.type(input(container, "name"), "Jane Doe");
    await userEvent.type(input(container, "field-postcode"), "SW1A 1AA");

    await waitFor(() => expect(lastSent("EV_CHANGE")?.isComplete).toBe(true));
    expect(lastSent("EV_COMPLETE")?.fields).toEqual({
      postcode: "encrypted(SW1A 1AA)",
    });
  });

  it("is complete with an optional field left empty", async () => {
    const container = card([
      node("name"),
      field("nickname", { name: "nickname" }),
    ]);

    await userEvent.type(input(container, "name"), "Jane Doe");

    await waitFor(() => expect(lastSent("EV_CHANGE")?.isComplete).toBe(true));
  });

  it("shows the errors of untouched fields when the card is validated", async () => {
    const container = card([
      field("postcode", { name: "postcode", required: "" }),
    ]);

    act(() => validate.request());

    await waitFor(() =>
      expect(lastSent("EV_VALIDATED")?.errors).toEqual({
        fields: { postcode: "required" },
      })
    );
    expect(lastSent("EV_VALIDATED")?.isValid).toBe(false);
    expect(errorText(container)).toBe(REQUIRED);
  });

  it("reports a change when validating shows a field's error", async () => {
    card([field("postcode", { name: "postcode", required: "" })]);

    act(() => validate.request());

    await waitFor(() =>
      expect(lastSent("EV_CHANGE")?.errors).toEqual({
        fields: { postcode: "required" },
      })
    );
  });

  it("validates a card with valid fields as valid", async () => {
    const container = card([
      field("postcode", { name: "postcode", required: "" }),
    ]);

    await userEvent.type(input(container, "field-postcode"), "SW1A 1AA");

    act(() => validate.request());

    await waitFor(() => expect(lastSent("EV_VALIDATED")).toBeDefined());
    expect(lastSent("EV_VALIDATED")?.errors).toBeNull();
    expect(lastSent("EV_VALIDATED")?.fields).toEqual({
      postcode: "encrypted(SW1A 1AA)",
    });
  });
});

describe("<ev-field> rule changes", () => {
  function rules(props: Record<string, string>) {
    apply([
      { op: "update", id: "postcode", props: { name: "postcode", ...props } },
    ]);
  }

  it("clears a typed value when the field's rules change", async () => {
    const container = postcodeCard({ pattern: "\\d+" });

    await userEvent.type(input(container, "field-postcode"), "4242");
    rules({ pattern: "4.*" });

    await waitFor(() =>
      expect(input(container, "field-postcode").value).toBe("")
    );
  });

  it("reports the same, whatever rules a typed value is probed with", async () => {
    const container = postcodeCard({ required: "" });

    await userEvent.type(input(container, "field-postcode"), "4242");

    const probe = async (pattern: string) => {
      rules({ required: "", pattern });
      await settle();
      send.mockClear();
      act(() => validate.request());
      await waitFor(() => expect(lastSent("EV_VALIDATED")).toBeDefined());
      const { fields, errors, isValid, isComplete } = lastSent("EV_VALIDATED")!;
      return { fields, errors, isValid, isComplete };
    };

    const matching = await probe("4.*");
    const failing = await probe("5.*");

    expect(matching).toEqual(failing);
    expect(matching.errors).toEqual({ fields: { postcode: "required" } });
  });

  it("keeps the value cleared when the old rules come back", async () => {
    const container = postcodeCard({ pattern: "\\d+" });

    await userEvent.type(input(container, "field-postcode"), "4242");
    rules({ pattern: "4.*" });
    await waitFor(() =>
      expect(input(container, "field-postcode").value).toBe("")
    );

    rules({ pattern: "\\d+" });
    await settle();

    expect(input(container, "field-postcode").value).toBe("");
  });

  it("clears a value when its field is declared again with other rules", async () => {
    const postcode = field("postcode", { name: "postcode", pattern: "\\d+" });
    const container = card([node("name"), postcode]);

    await userEvent.type(input(container, "field-postcode"), "4242");
    apply([{ op: "remove", id: "postcode" }]);
    apply([
      {
        op: "insert",
        parentId: null,
        index: 1,
        node: { ...postcode, props: { name: "postcode", pattern: "4.*" } },
      },
    ]);

    expect(input(container, "field-postcode").value).toBe("");
  });

  it("clears the error shown under the old rules", async () => {
    const container = postcodeCard({ pattern: POSTCODE });
    const postcode = input(container, "field-postcode");

    await userEvent.type(postcode, "123");
    leave(postcode);
    await waitFor(() => expect(validity(container)).toBe("false"));

    rules({ pattern: "\\d+" });

    await waitFor(() => expect(validity(container)).toBe("true"));
  });

  it("keeps the value when anything but a rule changes", async () => {
    const container = postcodeCard({ pattern: "\\d+" });

    await userEvent.type(input(container, "field-postcode"), "4242");
    rules({ pattern: "\\d+", label: "Postcode", placeholder: "1234" });
    await settle();

    expect(input(container, "field-postcode").value).toBe("4242");
  });
});
