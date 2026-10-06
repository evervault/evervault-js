/**
 * @vitest-environment happy-dom
 */

import * as React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Card, type CardRef } from ".";
import { EvervaultContext } from "../../context";
import type { PromisifiedEvervaultClient } from "../../load/client";
import { FIELDS_IGNORED } from "./developerMessages";
import {
  FakeEvCard,
  evCard,
  fakeClient,
  registerFakeEvCard,
  settle,
} from "../../../test/helpers/card";

registerFakeEvCard();

// React warns once per file about its JSX transform, on whichever test renders first.
function fieldsWarnings(warn: { mock: { calls: unknown[][] } }) {
  return warn.mock.calls.filter(([message]) => message === FIELDS_IGNORED);
}

describe("Card with declared fields", () => {
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

    expect(fieldsWarnings(warn)).toHaveLength(1);
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

    expect(fieldsWarnings(warn)).toHaveLength(0);
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

  it("gives the expiry halves the deprecated map's expiry setting", async () => {
    const { wrapper } = fakeClient();

    const { container } = render(
      <Card autoComplete={{ expiry: false, expiryYear: true }}>
        <Card.ExpiryMonth />
        <Card.ExpiryYear />
      </Card>,
      { wrapper }
    );
    await settle();

    expect(container.innerHTML).toBe(
      "<ev-card>" +
        '<ev-card-expiry-month autocomplete="false"></ev-card-expiry-month>' +
        '<ev-card-expiry-year autocomplete=""></ev-card-expiry-year>' +
        "</ev-card>"
    );
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

  it("reports a card with an untouched required field as valid but incomplete", async () => {
    const { wrapper } = fakeClient();
    const onChange = vi.fn();

    render(
      <Card onChange={onChange}>
        <Card.Number />
        <Card.Field name="vat" required />
      </Card>,
      { wrapper }
    );
    await settle();

    evCard().dispatchEvent(
      new CustomEvent("change", {
        detail: {
          fields: { vat: null },
          errors: null,
          isValid: true,
          isComplete: false,
        },
      })
    );

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ isValid: true, isComplete: false })
    );
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

  it("hands preload to the <ev-card> before it mounts", async () => {
    const { wrapper } = fakeClient();

    render(
      <Card preload>
        <Card.Number />
      </Card>,
      { wrapper }
    );
    await settle();

    expect(evCard().settingsAtMount).toEqual({ preload: true });
  });

  it("shows the <ev-card> through its ref", async () => {
    const { wrapper } = fakeClient();
    const ref = React.createRef<CardRef>();

    render(
      <Card preload ref={ref}>
        <Card.Number />
      </Card>,
      { wrapper }
    );
    await settle();

    ref.current?.show();

    expect(evCard().show).toHaveBeenCalledOnce();
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
});
