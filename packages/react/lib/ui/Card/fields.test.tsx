/**
 * @vitest-environment happy-dom
 */

import * as React from "react";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CardField,
  CardCvc,
  CardExpiry,
  CardExpiryMonth,
  CardExpiryYear,
  CardHolder,
  CardNumber,
  CardRow,
} from "./fields";

function html(element: React.ReactElement) {
  return render(element).container.innerHTML;
}

// As browsers do: React 19 sets a prop an element has as that property.
const REFLECTED = ["autofocus", "spellcheck"];

describe("card elements keeping autofocus and spellcheck as attributes where the browser reflects them", () => {
  beforeEach(() => {
    for (const attribute of REFLECTED) {
      Object.defineProperty(HTMLElement.prototype, attribute, {
        configurable: true,
        get(this: HTMLElement) {
          return this.hasAttribute(attribute);
        },
        set(this: HTMLElement, value: unknown) {
          if (value) this.setAttribute(attribute, "");
          else this.removeAttribute(attribute);
        },
      });
    }
  });

  afterEach(() => {
    for (const attribute of REFLECTED) {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>)[
        attribute
      ];
    }
  });

  it("declares autofocus when autoFocus is true", () => {
    expect(html(<CardNumber autoFocus />)).toBe(
      '<ev-card-number autofocus=""></ev-card-number>'
    );
  });

  it("denies autofocus when autoFocus is false", () => {
    expect(html(<CardNumber autoFocus={false} />)).toBe(
      '<ev-card-number autofocus="false"></ev-card-number>'
    );
  });

  it("declares spellcheck when spellCheck is true", () => {
    expect(html(<CardField name="note" spellCheck />)).toBe(
      '<ev-field name="note" spellcheck=""></ev-field>'
    );
  });
});

describe("card elements", () => {
  it.each([
    ["ev-card-holder", <CardHolder key="a" />],
    ["ev-card-number", <CardNumber key="a" />],
    ["ev-card-expiry", <CardExpiry key="a" />],
    ["ev-card-expiry-month", <CardExpiryMonth key="a" />],
    ["ev-card-expiry-year", <CardExpiryYear key="a" />],
    ["ev-card-cvc", <CardCvc key="a" />],
    ["ev-field", <CardField key="a" name="a" />],
  ])("renders <%s>", (tag, element) => {
    expect(render(element).container.firstElementChild?.localName).toBe(tag);
  });

  it("renders a row around its children", () => {
    expect(
      html(
        <CardRow>
          <CardCvc />
        </CardRow>
      )
    ).toBe("<ev-row><ev-card-cvc></ev-card-cvc></ev-row>");
  });

  it("carries the field props as the attributes the element takes", () => {
    expect(
      html(
        <CardNumber
          label="Card number"
          placeholder="1234"
          tooltip="On the front"
          iconPosition="inline-start"
        />
      )
    ).toBe(
      '<ev-card-number label="Card number" placeholder="1234" tooltip="On the front" iconposition="inline-start"></ev-card-number>'
    );
  });

  it("carries every setting each card field element takes", () => {
    expect(
      html(
        <CardHolder
          defaultValue="Jane Doe"
          pattern="[A-Za-z ]+"
          autoProgress
          errorMessage="Check the name"
        />
      )
    ).toBe(
      '<ev-card-holder autoprogress="" errormessage="Check the name" defaultvalue="Jane Doe" pattern="[A-Za-z ]+"></ev-card-holder>'
    );
    expect(
      html(<CardNumber unsupportedBrandMessage="Visa or Mastercard only" />)
    ).toBe(
      '<ev-card-number unsupportedbrandmessage="Visa or Mastercard only"></ev-card-number>'
    );
    expect(html(<CardCvc allow3DigitAmex={false} autoProgress={false} />)).toBe(
      '<ev-card-cvc autoprogress="false" allow3digitamex="false"></ev-card-cvc>'
    );
    expect(html(<CardExpiryMonth errorMessage="Check the month" />)).toBe(
      '<ev-card-expiry-month errormessage="Check the month"></ev-card-expiry-month>'
    );
  });

  it("declares a boolean prop set to true and denies one set to false", () => {
    expect(html(<CardCvc redact optional={false} autoComplete={false} />)).toBe(
      '<ev-card-cvc autocomplete="false" redact="" optional="false"></ev-card-cvc>'
    );
  });

  it("removes an attribute whose prop is no longer given", () => {
    const { container, rerender } = render(<CardNumber label="Number" />);

    rerender(<CardNumber />);

    expect(container.innerHTML).toBe("<ev-card-number></ev-card-number>");
  });

  it("reads each field's own props only", () => {
    const props = { iconPosition: "inline-end", redact: true } as object;

    expect(html(<CardCvc {...props} />)).toBe(
      '<ev-card-cvc redact=""></ev-card-cvc>'
    );
    expect(html(<CardNumber {...props} />)).toBe(
      '<ev-card-number iconposition="inline-end"></ev-card-number>'
    );
  });

  it("carries a custom field's props, numbers as strings", () => {
    const element = render(
      <CardField
        name="postcode"
        defaultValue="SW1A"
        autoComplete="postal-code"
        autoCapitalize="characters"
        required
        minLength={5}
        maxLength={8}
        pattern="[A-Z0-9 ]+"
        errorMessage="Enter a postcode"
        autoProgress
      />
    ).container.firstElementChild;

    expect(
      Object.fromEntries(
        [...(element?.attributes ?? [])].map((a) => [a.name, a.value])
      )
    ).toEqual({
      name: "postcode",
      defaultvalue: "SW1A",
      autocomplete: "postal-code",
      autocapitalize: "characters",
      required: "",
      minlength: "5",
      maxlength: "8",
      pattern: "[A-Z0-9 ]+",
      errormessage: "Enter a postcode",
      autoprogress: "",
    });
  });
});
