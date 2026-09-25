/**
 * @vitest-environment jsdom
 */

import {
  createEvent,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Card } from "../src/Card";
import type { CardSpecNode } from "types";
import { apply, input, node, settle, spec, type } from "./helpers/card";

vi.mock("@evervault/react", () => ({
  useEvervault: () => ({ encrypt: vi.fn() }),
}));

vi.mock("../src/utilities/useSearchParams", () => ({
  useSearchParams: () => ({ app: "app_test123", id: "frame1" }),
}));

vi.mock("../src/utilities/useMessaging", () => ({
  useMessaging: () => ({
    send: vi.fn(),
    on: (type: string, callback: (payload: unknown) => void) => {
      if (type === "EV_SPEC_PATCH") {
        spec.patch = callback as typeof spec.patch;
      }
      return () => {};
    },
  }),
}));

// A card declared with these fields, in this order, and auto-progress on.
function declared(types: CardSpecNode["type"][]) {
  return render(
    <Card
      config={{ autoProgress: true, fields: types.map((t) => node(t, t)) }}
    />
  );
}

function backspace(element: HTMLInputElement) {
  const event = createEvent.keyDown(element, { key: "Backspace" });
  fireEvent(element, event);
  return event;
}

const NUMBER = "4242424242424242";
const AMEX = "378282246310005";

describe("Card auto-advance", () => {
  it("advances to the next declared field", async () => {
    const { container } = declared(["number", "cvc", "expiry"]);

    type(input(container, "number"), NUMBER);

    await waitFor(() => expect(document.activeElement?.id).toBe("cvc"));
  });

  it("advances when no expiry field is declared", async () => {
    const { container } = declared(["number", "cvc"]);

    type(input(container, "number"), NUMBER);

    await waitFor(() => expect(document.activeElement?.id).toBe("cvc"));
  });

  it("advances from the expiry to the next declared field", async () => {
    const { container } = declared(["expiry", "name", "cvc"]);

    type(input(container, "expiry"), "1225");

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
  });

  it("advances from the cvc to the next declared field", async () => {
    const { container } = declared(["number", "cvc", "expiry"]);

    type(input(container, "number"), NUMBER);
    type(input(container, "cvc"), "123");

    await waitFor(() => expect(document.activeElement?.id).toBe("expiry"));
  });

  it("waits for the fourth digit of an Amex security code before advancing", async () => {
    const { container } = declared(["number", "cvc", "expiry"]);

    type(input(container, "number"), AMEX);
    type(input(container, "cvc"), "123");

    await settle();
    expect(document.activeElement?.id).toBe("cvc");

    type(input(container, "cvc"), "1234");

    await waitFor(() => expect(document.activeElement?.id).toBe("expiry"));
  });

  it("stops at the security code when a narrower brand truncates it", async () => {
    const { container } = declared(["number", "cvc", "expiry"]);

    type(input(container, "number"), AMEX);
    type(input(container, "cvc"), "1234");

    await waitFor(() => expect(document.activeElement?.id).toBe("expiry"));

    type(input(container, "number"), NUMBER);

    await settle();
    expect(input(container, "cvc").value).toBe("123");
    expect(document.activeElement?.id).toBe("cvc");
  });

  it("advances from the security code at four digits when the brand is unknown", async () => {
    const { container } = declared(["cvc", "number", "expiry"]);

    type(input(container, "cvc"), "123");

    await settle();
    expect(document.activeElement?.id).toBe("cvc");

    type(input(container, "cvc"), "1234");

    await waitFor(() => expect(document.activeElement?.id).toBe("number"));
  });

  it("does not move focus past the last field", async () => {
    const { container } = declared(["expiry", "number"]);

    type(input(container, "number"), NUMBER);

    await settle();
    expect(input(container, "number").value).toBe("4242 4242 4242 4242");
    expect(document.activeElement?.id).toBe("number");
  });

  it("advances along the order the latest patch declared", async () => {
    const { container } = declared(["number", "expiry", "cvc"]);

    apply([{ op: "move", id: "expiry", parentId: null, index: 0 }]);

    type(input(container, "number"), NUMBER);

    await waitFor(() => expect(document.activeElement?.id).toBe("cvc"));
  });

  it("steps back when backspace is pressed in an empty field", async () => {
    const { container } = render(<Card config={{ autoProgress: true }} />);

    const cvc = input(container, "cvc");
    cvc.focus();

    backspace(cvc);

    await waitFor(() => expect(document.activeElement?.id).toBe("expiry"));
  });

  it("cancels the backspace that steps back", () => {
    const { container } = render(<Card config={{ autoProgress: true }} />);

    const cvc = input(container, "cvc");
    cvc.focus();

    expect(backspace(cvc).defaultPrevented).toBe(true);
  });

  it("does not cancel a backspace that has a character to delete", async () => {
    const { container } = render(<Card config={{ autoProgress: true }} />);

    const cvc = input(container, "cvc");
    type(cvc, "123");

    await settle();

    expect(backspace(cvc).defaultPrevented).toBe(false);
  });

  it("does not step back from the first field, or cancel the keystroke", async () => {
    const { container } = render(<Card config={{ autoProgress: true }} />);

    const number = input(container, "number");
    number.focus();

    expect(backspace(number).defaultPrevented).toBe(false);

    await settle();
    expect(document.activeElement?.id).toBe("number");
  });

  it("does not step back out of a field that still has a value", async () => {
    const { container } = render(<Card config={{ autoProgress: true }} />);

    const cvc = input(container, "cvc");
    type(cvc, "123");

    await waitFor(() => expect(cvc.value).toBe("123"));

    backspace(cvc);

    await settle();
    expect(document.activeElement?.id).toBe("cvc");
  });

  it("does not step back when auto-progress is off", async () => {
    const { container } = render(<Card config={{}} />);

    const cvc = input(container, "cvc");
    cvc.focus();

    backspace(cvc);

    await settle();
    expect(document.activeElement?.id).toBe("cvc");
  });
});
