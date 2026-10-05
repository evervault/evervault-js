/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Card } from "../src/Card";
import type { CardConfig } from "../src/Card/types";
import type { CardSpecNode } from "types";
import { field, input, node, row, settle, spec } from "./helpers/card";

vi.mock("@evervault/react", () => ({
  useEvervault: () => ({
    encrypt: async (value: string) => `encrypted(${value})`,
  }),
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
  return render(<Card config={{ ...config, fields: nodes }} />).container;
}

function errorOf(container: HTMLElement, name: string) {
  return container.querySelector(`[ev-name=${name}] .error`)?.textContent;
}

const NUMBER = "4242424242424242";

describe("autoprogress for each field", () => {
  it("advances from a field declaring autoprogress", async () => {
    const container = card([
      node("number", "number", { autoprogress: "" }),
      node("cvc"),
    ]);

    await userEvent.type(input(container, "number"), NUMBER);

    await waitFor(() => expect(document.activeElement?.id).toBe("cvc"));
  });

  it("stays in a field the card turns auto-progress on for, but not this one", async () => {
    const container = card([node("number"), node("expiry"), node("cvc")], {
      autoProgress: { expiry: true },
    });

    await userEvent.type(input(container, "number"), NUMBER);
    await settle();

    expect(document.activeElement?.id).toBe("number");
  });

  it("advances from a field the card names", async () => {
    const container = card([node("number"), node("cvc")], {
      autoProgress: { number: true },
    });

    await userEvent.type(input(container, "number"), NUMBER);

    await waitFor(() => expect(document.activeElement?.id).toBe("cvc"));
  });

  it("lets a field turn off the auto-progress the card turns on", async () => {
    const container = card(
      [node("number", "number", { autoprogress: "false" }), node("cvc")],
      { autoProgress: true }
    );

    await userEvent.type(input(container, "number"), NUMBER);
    await settle();

    expect(document.activeElement?.id).toBe("number");
  });

  it("advances from an expiry half the card sets for the whole expiry", async () => {
    const container = card(
      [row("row", [node("expiryMonth"), node("expiryYear")]), node("cvc")],
      { autoProgress: { expiry: true } }
    );

    await userEvent.type(input(container, "expiry-month"), "12");

    await waitFor(() => expect(document.activeElement?.id).toBe("expiry-year"));
  });

  it("gives an expiry half's own setting precedence over the expiry's", async () => {
    const container = card(
      [row("row", [node("expiryMonth"), node("expiryYear")]), node("cvc")],
      { autoProgress: { expiry: true, expiryMonth: false } }
    );

    await userEvent.type(input(container, "expiry-month"), "12");
    await settle();

    expect(document.activeElement?.id).toBe("expiry-month");
  });

  it("advances from a custom field once it reaches its maximum length", async () => {
    const container = card([
      field("postcode", {
        name: "postcode",
        maxlength: "4",
        autoprogress: "",
      }),
      node("number"),
    ]);

    const postcode = input(container, "field-postcode");
    postcode.focus();
    fireEvent.change(postcode, { target: { value: "SW1" } });
    expect(document.activeElement?.id).toBe("field-postcode");

    fireEvent.change(postcode, { target: { value: "SW1A" } });

    await waitFor(() => expect(document.activeElement?.id).toBe("number"));
  });

  it("never advances from a custom field without a maximum length", async () => {
    const container = card(
      [field("postcode", { name: "postcode" }), node("number")],
      { autoProgress: true }
    );

    const postcode = input(container, "field-postcode");
    postcode.focus();
    fireEvent.change(postcode, { target: { value: "SW1A 1AA" } });
    await settle();

    expect(document.activeElement?.id).toBe("field-postcode");
  });
});

describe("autocomplete for each field", () => {
  it("turns autocomplete off on every field the card turns it off for", () => {
    const container = card([node("number"), node("cvc")], {
      autoComplete: false,
    });

    expect(input(container, "number").autocomplete).toBe("off");
    expect(input(container, "cvc").autocomplete).toBe("off");
  });

  it("turns autocomplete off for an expiry half the card names", () => {
    const container = card(
      [row("row", [node("expiryMonth"), node("expiryYear")])],
      { autoComplete: { expiryMonth: false } }
    );

    expect(input(container, "expiry-month").autocomplete).toBe("off");
    expect(input(container, "expiry-year").autocomplete).not.toBe("off");
  });
});

describe("error messages", () => {
  it("shows a field's declared error message", async () => {
    const container = card([
      node("number", "number", { errormessage: "Check the number" }),
    ]);

    await userEvent.type(input(container, "number"), "4242");
    fireEvent.blur(input(container, "number"));

    await waitFor(() =>
      expect(errorOf(container, "number")).toBe("Check the number")
    );
  });

  it("shows the number's declared unsupported brand message", async () => {
    const container = card(
      [
        node("number", "number", {
          unsupportedbrandmessage: "We take Mastercard only",
        }),
      ],
      { acceptedBrands: ["mastercard"] }
    );

    await userEvent.type(input(container, "number"), NUMBER);
    fireEvent.blur(input(container, "number"));

    await waitFor(() =>
      expect(errorOf(container, "number")).toBe("We take Mastercard only")
    );
  });

  it("shows the expiry error message declared on either half", async () => {
    const container = card([
      row("row", [
        node("expiryMonth", "expiryMonth", {
          errormessage: "Check the date",
        }),
        node("expiryYear"),
      ]),
    ]);

    await userEvent.type(input(container, "expiry-month"), "12");
    await userEvent.type(input(container, "expiry-year"), "20");
    fireEvent.blur(input(container, "expiry-year"));

    await waitFor(() =>
      expect(errorOf(container, "expiry-year")).toBe("Check the date")
    );
  });

  it("shows a custom field's error message from the card", async () => {
    const container = card([field("postcode", { name: "postcode" })], {
      validation: { fields: { postcode: { required: true } } },
      translations: {
        fields: { postcode: { errors: { required: "Postcode, please" } } },
      },
    });

    fireEvent.blur(input(container, "field-postcode"));

    await waitFor(() =>
      expect(errorOf(container, "field-postcode")).toBe("Postcode, please")
    );
  });
});

describe("validation for each field", () => {
  it("checks the cardholder name against the holder's pattern", async () => {
    const container = card([
      node("name", "name", {
        pattern: "[A-Za-z ]+",
        errormessage: "Letters only",
      }),
    ]);

    await userEvent.type(input(container, "name"), "J4ne");
    fireEvent.blur(input(container, "name"));

    await waitFor(() =>
      expect(errorOf(container, "name")).toBe("Letters only")
    );
  });

  it("refuses a 3-digit Amex security code when the field declares so", async () => {
    const container = card([
      node("number"),
      node("cvc", "cvc", { allow3digitamex: "false" }),
    ]);

    await userEvent.type(input(container, "number"), "378282246310005");
    await userEvent.type(input(container, "cvc"), "123");
    fireEvent.blur(input(container, "cvc"));

    await waitFor(() => expect(errorOf(container, "cvc")).toBeTruthy());
  });

  it("takes a custom field's rules from the card", async () => {
    const container = card([field("postcode", { name: "postcode" })], {
      validation: { fields: { postcode: { pattern: "[A-Z0-9 ]+" } } },
    });

    await userEvent.type(input(container, "field-postcode"), "sw1a");
    fireEvent.blur(input(container, "field-postcode"));

    await waitFor(() =>
      expect(errorOf(container, "field-postcode")).toBeTruthy()
    );
  });
});

describe("custom field settings from the card", () => {
  it("labels and fills a custom field from the card", () => {
    const container = card([field("postcode", { name: "postcode" })], {
      translations: {
        fields: { postcode: { label: "Postcode", placeholder: "SW1A 1AA" } },
      },
      defaultValues: { fields: { postcode: "EC1A" } },
    });

    expect(
      container.querySelector("label[for=field-postcode]")?.textContent
    ).toBe("Postcode");
    expect(input(container, "field-postcode").placeholder).toBe("SW1A 1AA");
    expect(input(container, "field-postcode").value).toBe("EC1A");
  });
});
