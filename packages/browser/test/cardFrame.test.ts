import { afterEach, describe, expect, it, vi } from "vitest";
import { CardFrame } from "../lib/ui/cardFrame";
import type EvervaultClient from "../lib/main";
import type { CardPayload } from "types";
import {
  countMessageListeners,
  frameMessage,
} from "./helpers/messageListeners";

const client = {
  config: {
    teamId: "team_test123",
    appId: "app_test123",
    components: { url: "https://ui-components.evervault.com" },
  },
} as unknown as EvervaultClient;

const payload: CardPayload = {
  card: {
    name: "Jane Doe",
    brand: "visa",
    localBrands: [],
    bin: "424242",
    lastFour: "4242",
    number: "ev:number",
    expiry: { month: "12", year: "30" },
    cvc: "ev:cvc",
  },
  isValid: true,
  isComplete: true,
  errors: null,
};

afterEach(() => {
  vi.restoreAllMocks();
});

function mounted() {
  const container = document.createElement("div");
  const frame = new CardFrame(client).mount(container);
  return { frame, container };
}

describe("CardFrame events", () => {
  it("mirrors the frame's change payload into values and dispatches change", () => {
    const { frame, container } = mounted();
    const change = vi.fn();
    frame.on("change", change);

    frameMessage(container, "EV_CHANGE", payload);

    expect(frame.values).toBe(payload);
    expect(change).toHaveBeenCalledWith(payload);
  });

  it("dispatches ready when the frame is ready", () => {
    const { frame, container } = mounted();
    const ready = vi.fn();
    frame.on("ready", ready);

    frameMessage(container, "EV_FRAME_READY");

    expect(ready).toHaveBeenCalledOnce();
  });

  it("carries the current values on a field event", () => {
    const { frame, container } = mounted();
    const focus = vi.fn();
    frame.on("focus", focus);

    frameMessage(container, "EV_CHANGE", payload);
    frameMessage(container, "EV_FOCUS", "number");

    expect(focus).toHaveBeenCalledWith({ field: "number", data: payload });
  });

  it("mirrors the validated payload into values and dispatches validate", () => {
    const { frame, container } = mounted();
    const validate = vi.fn();
    frame.on("validate", validate);

    frame.validate();
    frameMessage(container, "EV_VALIDATED", payload);

    expect(frame.values).toBe(payload);
    expect(validate).toHaveBeenCalledWith(payload);
  });
});

describe("CardFrame teardown", () => {
  it("releases every frame subscription when destroyed", () => {
    const listeners = countMessageListeners();
    const { frame } = mounted();

    expect(listeners()).toBe(10);

    frame.destroy();

    expect(listeners()).toBe(0);
  });

  it("releases the validate subscription when destroyed", () => {
    const listeners = countMessageListeners();
    const { frame } = mounted();

    frame.validate();

    expect(listeners()).toBe(11);

    frame.destroy();

    expect(listeners()).toBe(0);
  });

  it("drops a validate subscription once it has fired", () => {
    const removed = vi.spyOn(window, "removeEventListener");
    const { frame, container } = mounted();

    for (let i = 0; i < 5; i += 1) {
      frame.validate();
      frameMessage(container, "EV_VALIDATED", payload);
    }

    removed.mockClear();
    frame.destroy();

    // Only the constructor and mount subscriptions are left: the validate ones
    // dropped out as they fired.
    expect(
      removed.mock.calls.filter(([event]) => event === "message")
    ).toHaveLength(10);
  });

  it("does not subscribe when validated after being destroyed", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const listeners = countMessageListeners();
    const { frame } = mounted();

    frame.destroy();
    frame.validate();

    expect(listeners()).toBe(0);
    expect(error).toHaveBeenCalledWith(expect.stringContaining("destroyed"));
  });

  it("cannot be mounted again once destroyed", () => {
    const { frame } = mounted();

    frame.destroy();

    expect(() => frame.mount(document.createElement("div"))).toThrow(
      /destroyed/
    );
  });

  it("keeps its subscriptions when only unmounted", () => {
    const listeners = countMessageListeners();
    const { frame } = mounted();

    frame.unmount();

    expect(listeners()).toBe(10);
  });

  it("holds no listeners after repeated mount and destroy cycles", () => {
    const listeners = countMessageListeners();

    for (let i = 0; i < 50; i += 1) {
      mounted().frame.destroy();
    }

    expect(listeners()).toBe(0);
  });
});
