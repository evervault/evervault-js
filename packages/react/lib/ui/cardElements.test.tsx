/**
 * @vitest-environment happy-dom
 */

import * as React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  CardCustomField,
  CardCvc,
  CardExpiry,
  CardExpiryMonth,
  CardExpiryYear,
  CardHolder,
  CardNumber,
  CardRow,
} from "./cardElements";

function html(element: React.ReactElement) {
  return render(element).container.innerHTML;
}

describe("card elements", () => {
  it.each([
    [<CardHolder key="a" />, "ev-card-holder"],
    [<CardNumber key="a" />, "ev-card-number"],
    [<CardExpiry key="a" />, "ev-card-expiry"],
    [<CardExpiryMonth key="a" />, "ev-card-expiry-month"],
    [<CardExpiryYear key="a" />, "ev-card-expiry-year"],
    [<CardCvc key="a" />, "ev-card-cvc"],
    [<CardCustomField key="a" name="a" />, "ev-field"],
  ])("renders %# as <%s>", (element, tag) => {
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

  it("declares a boolean prop set to true and denies one set to false", () => {
    expect(html(<CardCvc redact optional={false} autoComplete={false} />)).toBe(
      '<ev-card-cvc autocomplete="false" redact="" optional="false"></ev-card-cvc>'
    );
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
      <CardCustomField
        name="postcode"
        defaultValue="SW1A"
        autoComplete="postal-code"
        autoCapitalize="characters"
        required
        minLength={5}
        maxLength={8}
        pattern="[A-Z0-9 ]+"
        errorMessage="Enter a postcode"
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
    });
  });
});
