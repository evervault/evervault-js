import { afterEach, describe, expect, it, vi } from "vitest";
import Card from "../lib/ui/card";
import type { CardPayload } from "types";
import { frameMessage } from "./helpers/messageListeners";
import { client } from "./helpers/client";

const payload: CardPayload = {
  card: {
    name: null,
    brand: "visa",
    localBrands: [],
    bin: "424242",
    lastFour: "4242",
    number: "ev:number",
    expiry: { month: "12", year: "30" },
    cvc: "ev:cvc",
  },
  fields: {},
  isValid: true,
  isComplete: true,
  threeDSProfilingId: null,
  errors: null,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ui.card", () => {
  it("shows a preloaded card with show()", () => {
    const container = document.createElement("div");
    const card = new Card(client).preload(container);
    const iframe = container.querySelector("iframe") as HTMLIFrameElement;

    expect(iframe.style.visibility).toBe("hidden");

    card.show();

    expect(iframe.style.visibility).toBe("");
  });

  it("reads the latest values the frame reported", () => {
    const container = document.createElement("div");
    const card = new Card(client).mount(container);

    frameMessage(container, "EV_CHANGE", payload);

    expect(card.values).toBe(payload);
  });

  it("starts with empty values", () => {
    const card = new Card(client);

    expect(card.values).toEqual({
      card: {
        name: null,
        brand: null,
        localBrands: [],
        bin: null,
        lastFour: null,
        number: null,
        expiry: { month: null, year: null },
        cvc: null,
      },
      fields: {},
      isValid: false,
      isComplete: false,
      threeDSProfilingId: null,
      errors: null,
    });
  });

  it("dispatches the frame's change event to its listeners", () => {
    const container = document.createElement("div");
    const card = new Card(client).mount(container);
    const change = vi.fn();
    card.on("change", change);

    frameMessage(container, "EV_CHANGE", payload);

    expect(change).toHaveBeenCalledWith(payload);
  });

  it("sends its options to the frame as the card config", () => {
    const card = new Card(client, {
      fields: ["number", "cvc"],
      hiddenFields: ["expiry"],
      autoProgress: true,
    });

    expect(card.config.config).toMatchObject({
      fields: ["number", "cvc"],
      hiddenFields: "expiry",
      autoProgress: true,
    });
  });

  it("sends the 3DS profiling option to the frame", () => {
    const card = new Card(client, { threeDSProfiling: true });

    expect(card.config.config.threeDSProfiling).toBe(true);
  });

  it("leaves 3DS profiling off by default", () => {
    const card = new Card(client);

    expect(card.config.config.threeDSProfiling).toBeUndefined();
  });

  it("starts with no 3DS profiling ID when profiling is on", () => {
    const card = new Card(client, { threeDSProfiling: true });

    expect(card.values.threeDSProfilingId).toBeNull();
  });

  it("reports one error and keeps its options when updated once destroyed", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const card = new Card(client, { autoProgress: false }).mount(
      document.createElement("div")
    );

    card.destroy();
    card.update({ autoProgress: true, defaultValues: { name: "Jane" } });

    expect(error).toHaveBeenCalledOnce();
    expect(card.config.config.autoProgress).toBe(false);
  });

  it("merges updated options into the card config", () => {
    const card = new Card(client, { fields: ["number"], autoProgress: true });

    card.update({ fields: ["number", "cvc"] });

    expect(card.config.config).toMatchObject({
      fields: ["number", "cvc"],
      autoProgress: true,
    });
  });
});
