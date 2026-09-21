import type { CardSpecNodeType } from "types";

export const ELEMENTS: Record<string, CardSpecNodeType> = {
  "ev-row": "row",
  "ev-card-number": "number",
  "ev-card-expiry": "expiry",
  "ev-card-expiry-month": "expiryMonth",
  "ev-card-expiry-year": "expiryYear",
  "ev-card-cvc": "cvc",
  "ev-field": "field",
};

export function warnUnknownChild(element: Element) {
  const supported = Object.keys(ELEMENTS)
    .map((tag) => `<${tag}>`)
    .join(", ");

  console.warn(
    `<${element.localName}> is not a supported child of <ev-card> and will be ignored. Supported children are: ${supported}.`
  );

  return null;
}
