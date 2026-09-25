import { afterEach, describe, expect, it, vi } from "vitest";
import { CardHost } from "../lib/ui/cardHost";
import type { CardPayload } from "types";
import {
  countMessageListeners,
  frameId,
  frameMessage,
} from "./helpers/messageListeners";
import { client } from "./helpers/client";

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
  const cardHost = new CardHost(client).mount(container);
  return { cardHost, container };
}

describe("CardHost events", () => {
  it("mirrors the frame's change payload into values and dispatches change", () => {
    const { cardHost, container } = mounted();
    const change = vi.fn();
    cardHost.on("change", change);

    frameMessage(container, "EV_CHANGE", payload);

    expect(cardHost.values).toBe(payload);
    expect(change).toHaveBeenCalledWith(payload);
  });

  it("dispatches ready when the frame is ready", () => {
    const { cardHost, container } = mounted();
    const ready = vi.fn();
    cardHost.on("ready", ready);

    frameMessage(container, "EV_FRAME_READY");

    expect(ready).toHaveBeenCalledOnce();
  });

  it("carries the current values on a field event", () => {
    const { cardHost, container } = mounted();
    const focus = vi.fn();
    cardHost.on("focus", focus);

    frameMessage(container, "EV_CHANGE", payload);
    frameMessage(container, "EV_FOCUS", "number");

    expect(focus).toHaveBeenCalledWith({ field: "number", data: payload });
  });

  it("mirrors the validated payload into values and dispatches validate", () => {
    const { cardHost, container } = mounted();
    const validate = vi.fn();
    cardHost.on("validate", validate);

    cardHost.validate();
    frameMessage(container, "EV_VALIDATED", payload);

    expect(cardHost.values).toBe(payload);
    expect(validate).toHaveBeenCalledWith(payload);
  });
});

describe("CardHost teardown", () => {
  it("releases every frame subscription when destroyed", () => {
    const listeners = countMessageListeners();
    const { cardHost } = mounted();

    expect(listeners()).toBeGreaterThan(0);

    cardHost.destroy();

    expect(listeners()).toBe(0);
  });

  it("releases the validate subscription when destroyed", () => {
    const listeners = countMessageListeners();
    const { cardHost } = mounted();
    const before = listeners();

    cardHost.validate();

    expect(listeners()).toBe(before + 1);

    cardHost.destroy();

    expect(listeners()).toBe(0);
  });

  it("drops a validate subscription once it has fired", () => {
    const listeners = countMessageListeners();
    const { cardHost, container } = mounted();
    const before = listeners();

    for (let i = 0; i < 5; i += 1) {
      cardHost.validate();
      frameMessage(container, "EV_VALIDATED", payload);
    }

    expect(listeners()).toBe(before);
  });

  it("reports a validate call once destroyed and subscribes nothing", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const listeners = countMessageListeners();
    const { cardHost } = mounted();

    cardHost.destroy();
    cardHost.validate();

    expect(error).toHaveBeenCalledWith(expect.stringContaining("destroyed"));
    expect(listeners()).toBe(0);
  });

  it("answers overlapping validate calls once", () => {
    const { cardHost, container } = mounted();
    const validate = vi.fn();
    cardHost.on("validate", validate);

    cardHost.validate();
    cardHost.validate();
    frameMessage(container, "EV_VALIDATED", payload);

    expect(validate).toHaveBeenCalledOnce();
  });

  it("reports a mount once destroyed and mounts nothing", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { cardHost } = mounted();
    const container = document.createElement("div");

    cardHost.destroy();
    cardHost.mount(container);

    expect(error).toHaveBeenCalledWith(expect.stringContaining("destroyed"));
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("keeps its own subscriptions when only unmounted", () => {
    const listeners = countMessageListeners();
    const cardHost = new CardHost(client);
    const own = listeners();

    cardHost.mount(document.createElement("div"));
    cardHost.unmount();

    expect(listeners()).toBe(own);
  });

  it("releases a pending validate reply when unmounted", () => {
    const { cardHost, container } = mounted();
    const validate = vi.fn();
    cardHost.on("validate", validate);

    const id = frameId(container);
    cardHost.validate();
    cardHost.unmount();
    frameMessage(id, "EV_VALIDATED", payload);

    expect(validate).not.toHaveBeenCalled();
  });

  it("reports a subscription once destroyed and registers nothing", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { cardHost, container } = mounted();
    const change = vi.fn();
    const id = frameId(container);

    cardHost.destroy();
    cardHost.on("change", change);
    frameMessage(id, "EV_CHANGE", payload);

    expect(error).toHaveBeenCalledWith(expect.stringContaining("destroyed"));
    expect(change).not.toHaveBeenCalled();
  });

  it("reports one error for an update once destroyed", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { cardHost } = mounted();

    cardHost.destroy();
    cardHost.update({ config: { autoProgress: true } });

    expect(error).toHaveBeenCalledOnce();
  });
});
