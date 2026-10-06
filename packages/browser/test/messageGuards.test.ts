import { afterEach, describe, expect, it, vi } from "vitest";
import { EvervaultFrame } from "../lib/ui/evervaultFrame";
import { CARD_GUARDS, GOOGLE_PAY_GUARDS } from "../lib/ui/messageGuards";
import { frameMessage } from "./helpers/messageListeners";
import { client } from "./helpers/client";
import type { CardFrameClientMessages } from "types";

const cardPayload = {
  card: { name: null, number: null },
  fields: {},
  isValid: false,
  isComplete: false,
  errors: null,
};

function mountedCardFrame() {
  const frame = new EvervaultFrame<CardFrameClientMessages>(
    client,
    "Card",
    CARD_GUARDS
  );
  const container = document.createElement("div");
  document.body.append(container);
  frame.mount(container);
  return { frame, container };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("EvervaultFrame message guards", () => {
  it("passes a well-formed payload with fields it does not know", () => {
    const { frame, container } = mountedCardFrame();
    const callback = vi.fn();
    frame.on("EV_CHANGE", callback);

    const payload = { ...cardPayload, addedLater: true };
    frameMessage(container, "EV_CHANGE", payload);

    expect(callback).toHaveBeenCalledWith(payload);
  });

  it.each([
    ["no payload", undefined],
    ["a string", "card"],
    ["no card", { ...cardPayload, card: undefined }],
    ["a non-boolean isComplete", { ...cardPayload, isComplete: "yes" }],
  ])("drops a card change with %s", (_, payload) => {
    const { frame, container } = mountedCardFrame();
    const callback = vi.fn();
    frame.on("EV_CHANGE", callback);

    frameMessage(container, "EV_CHANGE", payload);

    expect(callback).not.toHaveBeenCalled();
  });

  it("drops a malformed shared message", () => {
    const { frame, container } = mountedCardFrame();
    const callback = vi.fn();
    frame.on("EV_ERROR", callback);

    frameMessage(container, "EV_ERROR", { code: "x" });
    frameMessage(container, "EV_ERROR", { code: "x", message: "failed" });

    expect(callback).toHaveBeenCalledOnce();
  });

  it("ignores a resize without a numeric height", () => {
    const { container } = mountedCardFrame();
    const iframe = container.querySelector("iframe");

    frameMessage(container, "EV_RESIZE", { height: "120" });
    expect(iframe?.style.height).toBe("0px");

    frameMessage(container, "EV_RESIZE", { height: 120 });
    expect(iframe?.style.height).toBe("120px");
  });

  it.each([
    ["a card field", "number", true],
    ["a custom field", { field: "field", name: "postcode" }, true],
    ["a custom field with no name", { field: "field" }, false],
    ["a number", 1, false],
  ])("checks a focus target that is %s", (_, target, accepted) => {
    expect(CARD_GUARDS.EV_FOCUS(target)).toBe(accepted);
  });

  it("checks the id and amount of a Google Pay data change", () => {
    const guard = GOOGLE_PAY_GUARDS.EV_GOOGLE_PAY_DATA_CHANGE;

    expect(guard({ id: "a", trigger: "INITIALIZE", amount: 100 })).toBe(true);
    expect(guard({ id: "a", amount: "100" })).toBe(false);
    expect(guard({ amount: 100 })).toBe(false);
  });
});
