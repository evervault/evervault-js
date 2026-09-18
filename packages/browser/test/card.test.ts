import { afterEach, describe, expect, it, vi } from "vitest";
import Card from "../lib/ui/card";
import type EvervaultClient from "../lib/main";
import type { CardPayload } from "types";
import { frameMessage } from "./helpers/messageListeners";

const client = {
  config: {
    teamId: "team_test123",
    appId: "app_test123",
    components: { url: "https://ui-components.evervault.com" },
  },
} as unknown as EvervaultClient;

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
  isValid: true,
  isComplete: true,
  errors: null,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ui.card", () => {
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
      isValid: false,
      isComplete: false,
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

  it("merges updated options into the card config", () => {
    const card = new Card(client, { fields: ["number"], autoProgress: true });

    card.update({ fields: ["number", "cvc"] });

    expect(card.config.config).toMatchObject({
      fields: ["number", "cvc"],
      autoProgress: true,
    });
  });
});
