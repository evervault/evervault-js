/**
 * @vitest-environment happy-dom
 */

import * as React from "react";
import { act, render } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Card, type CardRef } from "./Card";
import { FIELDS_IGNORED } from "./developerMessages";
import { EvervaultContext } from "../context";
import type { PromisifiedEvervaultClient } from "../load/client";

// Stands in for the `<ev-card>` the browser SDK registers, recording what the
// wrapper hands it.
class FakeEvCard extends HTMLElement {
  static cards: FakeEvCard[] = [];
  client: unknown;
  settingsAtMount: Record<string, unknown> = {};
  assigned: string[] = [];
  validate = vi.fn();
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

beforeAll(() => {
  customElements.define("ev-card", FakeEvCard);
});

afterEach(() => {
  FakeEvCard.cards = [];
  vi.restoreAllMocks();
});

function fakeClient() {
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

async function settle() {
  await act(async () => {
    await Promise.resolve();
  });
}

function evCard() {
  const [card] = FakeEvCard.cards.slice(-1);
  if (!card) throw new Error("no <ev-card> was rendered");
  return card;
}

describe("Card", () => {
  it("renders the card from its options when it declares no fields", async () => {
    const { evervault, card, wrapper } = fakeClient();

    render(<Card fields={["number", "cvc"]} autoProgress />, { wrapper });
    await settle();

    expect(evervault.ui.card).toHaveBeenCalledWith(
      expect.objectContaining({ fields: ["number", "cvc"], autoProgress: true })
    );
    expect(card.mount).toHaveBeenCalledOnce();
    expect(FakeEvCard.cards).toHaveLength(0);
  });

  it("takes the props of a wrapper that extends them and passes children on", async () => {
    interface WrapperProps extends React.ComponentProps<typeof Card> {
      heading: string;
    }

    function Wrapper({ heading, ...props }: WrapperProps) {
      return (
        <section aria-label={heading}>
          <Card fields={["number"]} {...props} />
        </section>
      );
    }

    const { evervault, wrapper } = fakeClient();

    render(<Wrapper heading="Pay" redactCVC />, { wrapper });
    await settle();

    expect(evervault.ui.card).toHaveBeenCalledWith(
      expect.objectContaining({ fields: ["number"], redactCVC: true })
    );
  });

  it("renders the declared fields as the <ev-card> elements", async () => {
    const { evervault, wrapper } = fakeClient();

    const { container } = render(
      <Card>
        <Card.Number label="Card number" />
        <Card.Row>
          <Card.ExpiryMonth />
          <Card.ExpiryYear />
          <Card.Cvc redact />
        </Card.Row>
        <Card.Field name="postcode" required />
      </Card>,
      { wrapper }
    );
    await settle();

    expect(container.innerHTML).toBe(
      "<ev-card>" +
        '<ev-card-number label="Card number"></ev-card-number>' +
        "<ev-row>" +
        "<ev-card-expiry-month></ev-card-expiry-month>" +
        "<ev-card-expiry-year></ev-card-expiry-year>" +
        '<ev-card-cvc redact=""></ev-card-cvc>' +
        "</ev-row>" +
        '<ev-field name="postcode" required=""></ev-field>' +
        "</ev-card>"
    );
    expect(evervault.ui.card).not.toHaveBeenCalled();
  });

  it.each([
    ["null", null],
    ["an empty list", []],
  ])("renders the <ev-card> for children of %s", async (_, children) => {
    const { evervault, wrapper } = fakeClient();

    render(<Card fields={["number"]}>{children}</Card>, { wrapper });
    await settle();

    expect(evCard().client).toBe(evervault);
    expect(evervault.ui.card).not.toHaveBeenCalled();
  });

  it("renders the declared children in place of fields", async () => {
    const { evervault, wrapper } = fakeClient();

    const { container } = render(
      <Card fields={["number", "expiry"]}>
        <Card.Cvc />
      </Card>,
      { wrapper }
    );
    await settle();

    expect(container.innerHTML).toBe(
      "<ev-card><ev-card-cvc></ev-card-cvc></ev-card>"
    );
    expect(evervault.ui.card).not.toHaveBeenCalled();
  });

  it("warns once that fields given with children are ignored", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { wrapper } = fakeClient();

    const { rerender } = render(
      <Card fields={["number"]}>
        <Card.Cvc />
      </Card>,
      { wrapper }
    );
    rerender(
      <Card fields={["number"]}>
        <Card.Number />
      </Card>
    );
    await settle();

    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(FIELDS_IGNORED);
  });

  it("does not warn about fields when only children are given", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { wrapper } = fakeClient();

    render(
      <Card>
        <Card.Cvc />
      </Card>,
      { wrapper }
    );
    await settle();

    expect(warn).not.toHaveBeenCalled();
  });

  it("mounts the <ev-card> once in strict mode", async () => {
    const { wrapper } = fakeClient();
    const mountCard = vi.spyOn(FakeEvCard.prototype, "mountCard");

    render(
      <React.StrictMode>
        <Card>
          <Card.Number />
        </Card>
      </React.StrictMode>,
      { wrapper }
    );
    await settle();

    expect(mountCard).toHaveBeenCalledOnce();
  });

  it("keeps the <ev-card> while its children render nothing", async () => {
    const { evervault, wrapper } = fakeClient();

    const { rerender } = render(
      <Card>
        <Card.Number />
      </Card>,
      { wrapper }
    );
    await settle();
    const card = evCard();

    rerender(<Card>{false}</Card>);
    await settle();

    expect(evCard()).toBe(card);
    expect(evervault.ui.card).not.toHaveBeenCalled();
  });

  it("mounts the <ev-card> with the client once it has loaded", async () => {
    const { evervault, wrapper } = fakeClient();

    render(
      <Card>
        <Card.Number />
      </Card>,
      { wrapper }
    );
    await settle();

    expect(evCard().client).toBe(evervault);
  });

  it("hands the colour scheme and auto-progress to the <ev-card> before it mounts", async () => {
    const { wrapper } = fakeClient();

    render(
      <Card autoProgress={false} colorScheme="dark">
        <Card.Number />
      </Card>,
      { wrapper }
    );
    await settle();

    expect(evCard().settingsAtMount).toEqual({
      autoProgress: false,
      colorScheme: "dark",
    });
  });

  it("falls back on the deprecated security code props in <Card.Cvc>", async () => {
    const { wrapper } = fakeClient();

    const { container } = render(
      <Card redactCVC allow3DigitAmexCVC={false}>
        <Card.Cvc />
      </Card>,
      { wrapper }
    );
    await settle();

    expect(container.innerHTML).toBe(
      '<ev-card><ev-card-cvc redact="" allow3digitamex="false"></ev-card-cvc></ev-card>'
    );
  });

  it("lets <Card.Cvc>'s own props win over the deprecated ones", async () => {
    const { wrapper } = fakeClient();

    const { container } = render(
      <Card redactCVC allow3DigitAmexCVC={false}>
        <Card.Cvc redact={false} allow3DigitAmex />
      </Card>,
      { wrapper }
    );
    await settle();

    expect(container.innerHTML).toBe(
      '<ev-card><ev-card-cvc redact="false" allow3digitamex=""></ev-card-cvc></ev-card>'
    );
  });

  it("gives each field its setting from a deprecated autoComplete map", async () => {
    const { wrapper } = fakeClient();

    const { container } = render(
      <Card
        autoComplete={{
          name: false,
          number: false,
          expiryMonth: false,
          cvc: true,
          fields: { postcode: false },
        }}
      >
        <Card.Holder />
        <Card.Number />
        <Card.ExpiryMonth />
        <Card.ExpiryYear />
        <Card.Cvc autoComplete={false} />
        <Card.Field name="postcode" />
        <Card.Field name="email" />
      </Card>,
      { wrapper }
    );
    await settle();

    expect(container.innerHTML).toBe(
      "<ev-card>" +
        '<ev-card-holder autocomplete="false"></ev-card-holder>' +
        '<ev-card-number autocomplete="false"></ev-card-number>' +
        '<ev-card-expiry-month autocomplete="false"></ev-card-expiry-month>' +
        "<ev-card-expiry-year></ev-card-expiry-year>" +
        '<ev-card-cvc autocomplete="false"></ev-card-cvc>' +
        '<ev-field autocomplete="false" name="postcode"></ev-field>' +
        '<ev-field name="email"></ev-field>' +
        "</ev-card>"
    );
    expect(evCard().assigned).not.toContain("autoComplete");
  });

  it("gives every custom field one deprecated autoComplete setting", async () => {
    const { wrapper } = fakeClient();

    const { container } = render(
      <Card autoComplete={{ fields: false }}>
        <Card.Field name="postcode" />
      </Card>,
      { wrapper }
    );
    await settle();

    expect(container.innerHTML).toBe(
      '<ev-card><ev-field autocomplete="false" name="postcode"></ev-field></ev-card>'
    );
  });

  it("hands autofill turned on or off to the <ev-card>", async () => {
    const { wrapper } = fakeClient();

    const { container } = render(
      <Card autoComplete={false}>
        <Card.Number />
      </Card>,
      { wrapper }
    );
    await settle();

    expect(evCard().settingsAtMount).toEqual({ autoComplete: false });
    expect(container.innerHTML).toBe(
      "<ev-card><ev-card-number></ev-card-number></ev-card>"
    );
  });

  it("hands the settings to the <ev-card> before it mounts", async () => {
    const { wrapper } = fakeClient();
    const translations = {
      number: { label: "Number" },
      expiry: {},
      cvc: {},
    };

    render(
      <Card acceptedBrands={["visa"]} translations={translations}>
        <Card.Number />
      </Card>,
      { wrapper }
    );
    await settle();

    expect(evCard().settingsAtMount).toEqual({
      acceptedBrands: ["visa"],
      translations,
    });
  });

  it("sets only the settings that changed", async () => {
    const { wrapper } = fakeClient();
    const brands = ["visa" as const];

    const { rerender } = render(
      <Card acceptedBrands={brands}>
        <Card.Number />
      </Card>,
      { wrapper }
    );
    await settle();
    evCard().assigned = [];

    rerender(
      <Card
        acceptedBrands={brands}
        translations={{ number: {}, expiry: {}, cvc: {} }}
      >
        <Card.Number />
      </Card>
    );

    expect(evCard().assigned).toEqual(["translations"]);
  });

  it("calls the event props with what the <ev-card> reports", async () => {
    const { wrapper } = fakeClient();
    const onChange = vi.fn();
    const onFocus = vi.fn();
    const onReady = vi.fn();

    render(
      <Card onChange={onChange} onFocus={onFocus} onReady={onReady}>
        <Card.Number />
      </Card>,
      { wrapper }
    );
    await settle();

    const card = evCard();
    card.dispatchEvent(
      new CustomEvent("change", { detail: { isValid: true } })
    );
    card.dispatchEvent(
      new CustomEvent("focus", { detail: { field: "number" } })
    );
    card.dispatchEvent(new CustomEvent("ready"));

    expect(onChange).toHaveBeenCalledWith({ isValid: true });
    expect(onFocus).toHaveBeenCalledWith({ field: "number" });
    expect(onReady).toHaveBeenCalledOnce();
  });

  it("ignores the browser's own events of the same names", async () => {
    const { wrapper } = fakeClient();
    const onFocus = vi.fn();
    const onKeyDown = vi.fn();

    render(
      <Card onFocus={onFocus} onKeyDown={onKeyDown}>
        <Card.Number />
      </Card>,
      { wrapper }
    );
    await settle();

    evCard().dispatchEvent(new FocusEvent("focus"));
    evCard().dispatchEvent(new KeyboardEvent("keydown"));

    expect(onFocus).not.toHaveBeenCalled();
    expect(onKeyDown).not.toHaveBeenCalled();
  });

  it("stops calling the event props once unmounted", async () => {
    const { wrapper } = fakeClient();
    const onChange = vi.fn();

    const { unmount } = render(
      <Card onChange={onChange}>
        <Card.Number />
      </Card>,
      { wrapper }
    );
    await settle();
    const card = evCard();

    unmount();
    card.dispatchEvent(new CustomEvent("change", { detail: {} }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls the latest event prop", async () => {
    const { wrapper } = fakeClient();
    const first = vi.fn();
    const second = vi.fn();

    const { rerender } = render(
      <Card onChange={first}>
        <Card.Number />
      </Card>,
      { wrapper }
    );
    await settle();

    rerender(
      <Card onChange={second}>
        <Card.Number />
      </Card>
    );
    evCard().dispatchEvent(new CustomEvent("change", { detail: {} }));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it("validates the <ev-card> through its ref", async () => {
    const { wrapper } = fakeClient();
    const ref = React.createRef<CardRef>();

    render(
      <Card ref={ref}>
        <Card.Number />
      </Card>,
      { wrapper }
    );
    await settle();

    ref.current?.validate();

    expect(evCard().validate).toHaveBeenCalledOnce();
  });

  it("reports a client that failed to load as an error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onError = vi.fn();
    const failed = Promise.reject(
      new Error("no script")
    ) as unknown as PromisifiedEvervaultClient;
    failed.catch(() => {});

    render(
      <EvervaultContext.Provider value={failed}>
        <Card onError={onError}>
          <Card.Number />
        </Card>
      </EvervaultContext.Provider>
    );
    await settle();

    expect(onError).toHaveBeenCalledOnce();
    expect(evCard().isMounted).toBe(false);
  });

  it("reports a card that fails to mount as an error", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { wrapper } = fakeClient();
    const onError = vi.fn();
    vi.spyOn(FakeEvCard.prototype, "mountCard").mockImplementation(() => {
      throw new Error("mount failed");
    });

    render(
      <Card onError={onError}>
        <Card.Number />
      </Card>,
      { wrapper }
    );
    await settle();

    expect(onError).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledWith(new Error("mount failed"));
  });

  it("mounts the card from its options by default", async () => {
    const { card, wrapper } = fakeClient();

    render(<Card />, { wrapper });
    await settle();

    expect(card.mount).toHaveBeenCalledOnce();
    expect(card.preload).not.toHaveBeenCalled();
  });

  it("preloads the card from its options instead of mounting it", async () => {
    const { card, wrapper } = fakeClient();

    render(<Card preload />, { wrapper });
    await settle();

    expect(card.preload).toHaveBeenCalledOnce();
    expect(card.mount).not.toHaveBeenCalled();
  });

  it("shows a preloaded card through its ref", async () => {
    const { card, wrapper } = fakeClient();
    const ref = React.createRef<CardRef>();

    render(<Card preload ref={ref} />, { wrapper });
    await settle();
    ref.current?.show();

    expect(card.show).toHaveBeenCalledOnce();
  });
});
