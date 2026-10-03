import type { CardSpecNodeType } from "types";

// How an attribute holds its prop's value: `switch` also reads "off" as off,
// as `autocomplete` does.
export type FieldAttributeKind = "text" | "flag" | "switch" | "number";

// A field's prop, which names its attribute in lower case, and how the
// attribute holds it.
export type FieldAttribute = readonly [prop: string, kind: FieldAttributeKind];

const COMMON = [
  ["label", "text"],
  ["placeholder", "text"],
  ["tooltip", "text"],
  ["autoFocus", "flag"],
  ["autoProgress", "flag"],
  ["errorMessage", "text"],
] as const;

export const CARD_FIELD_ATTRIBUTES = [
  ...COMMON,
  ["autoComplete", "switch"],
] as const;

// The attributes each field of the card takes, wherever it is declared.
export const FIELD_ATTRIBUTES = {
  name: [
    ...CARD_FIELD_ATTRIBUTES,
    ["defaultValue", "text"],
    ["pattern", "text"],
  ],
  number: [
    ...CARD_FIELD_ATTRIBUTES,
    ["iconPosition", "text"],
    ["unsupportedBrandMessage", "text"],
  ],
  expiry: CARD_FIELD_ATTRIBUTES,
  expiryMonth: CARD_FIELD_ATTRIBUTES,
  expiryYear: CARD_FIELD_ATTRIBUTES,
  cvc: [
    ...CARD_FIELD_ATTRIBUTES,
    ["redact", "flag"],
    ["optional", "flag"],
    ["allow3DigitAmex", "flag"],
  ],
  // The customer's own field: `autocomplete` takes a browser token too.
  field: [
    ...COMMON,
    ["autoComplete", "text"],
    ["name", "text"],
    ["type", "text"],
    ["defaultValue", "text"],
    ["readOnly", "flag"],
    ["inputMode", "text"],
    ["autoCapitalize", "text"],
    ["spellCheck", "flag"],
    ["enterKeyHint", "text"],
    ["required", "flag"],
    ["minLength", "number"],
    ["maxLength", "number"],
    ["pattern", "text"],
    ["min", "text"],
    ["max", "text"],
    ["step", "text"],
  ],
} as const satisfies Record<
  Exclude<CardSpecNodeType, "row">,
  readonly FieldAttribute[]
>;
