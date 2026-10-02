import * as React from "react";
import { act } from "@testing-library/react";
import { afterEach, beforeAll, vi } from "vitest";
import { EvervaultContext } from "../../lib/context";
import type { PromisifiedEvervaultClient } from "../../lib/load/client";

// Stands in for the `<ev-card>` the browser SDK registers, recording what the
// wrapper hands it.
export class FakeEvCard extends HTMLElement {
  static cards: FakeEvCard[] = [];
  client: unknown;
  settingsAtMount: Record<string, unknown> = {};
  assigned: string[] = [];
  validate = vi.fn();
  show = vi.fn();
  #settings: Record<string, unknown> = {};

  constructor() {
    super();
    FakeEvCard.cards.push(this);
  }

  get isMounted() {
    return this.client !== undefined;
  }

  mountCard(client: unknown) {
    this.client = client;
    this.settingsAtMount = { ...this.#settings };
  }

  static {
    for (const setting of [
      "theme",
      "colorScheme",
      "autoProgress",
      "acceptedBrands",
      "translations",
      "autoComplete",
      "preload",
    ]) {
      Object.defineProperty(this.prototype, setting, {
        // As on the element, a list reads back as a new array.
        get(this: FakeEvCard) {
          const value = this.#settings[setting];
          return Array.isArray(value) ? [...value] : value;
        },
        set(this: FakeEvCard, value: unknown) {
          this.assigned.push(setting);
          this.#settings[setting] = value;
        },
      });
    }
  }
}

export function fakeClient() {
  const card = {
    mount: vi.fn(() => card),
    preload: vi.fn(() => card),
    show: vi.fn(() => card),
    update: vi.fn(() => card),
    validate: vi.fn(() => card),
    on: vi.fn(() => () => {}),
  };
  const evervault = { ui: { card: vi.fn(() => card) } };
  const client = Promise.resolve(
    evervault
  ) as unknown as PromisifiedEvervaultClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <EvervaultContext.Provider value={client}>
      {children}
    </EvervaultContext.Provider>
  );

  return { evervault, card, wrapper };
}

export async function settle() {
  await act(async () => {
    await Promise.resolve();
  });
}

export function evCard() {
  const [card] = FakeEvCard.cards.slice(-1);
  if (!card) throw new Error("no <ev-card> was rendered");
  return card;
}

// Registers the stand-in `<ev-card>` for the test file it is called in.
export function registerFakeEvCard() {
  beforeAll(() => {
    customElements.define("ev-card", FakeEvCard);
  });

  afterEach(() => {
    FakeEvCard.cards = [];
    vi.restoreAllMocks();
  });
}
