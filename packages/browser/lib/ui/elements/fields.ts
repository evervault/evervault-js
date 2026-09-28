import { ElementBase, adoptProperties, reflect } from "./reflect";
import type { Reflection } from "./reflect";

// A field of the card: its settings are its attributes, readable and writable
// as properties.
class FieldElement extends ElementBase {
  declare label?: string;
  declare placeholder?: string;
  declare tooltip?: string;
  declare autoFocus?: boolean;
  declare autoProgress?: boolean;
  declare errorMessage?: string;

  // Each field declares its own.
  static readonly reflections: readonly Reflection<never>[] = [];

  connectedCallback() {
    const { reflections } = this.constructor as typeof FieldElement;
    adoptProperties(
      this,
      reflections.map(([property]) => property)
    );
  }
}

const COMMON: Reflection<FieldElement>[] = [
  ["label", "text"],
  ["placeholder", "text"],
  ["tooltip", "text"],
  ["autoFocus", "flag"],
  ["autoProgress", "flag"],
  ["errorMessage", "text"],
];

class EvCardFieldElement extends FieldElement {
  declare autoComplete?: boolean;
}

const CARD_FIELD: Reflection<EvCardFieldElement>[] = [
  ...COMMON,
  ["autoComplete", "switch"],
];

export class EvCardHolder extends EvCardFieldElement {
  declare defaultValue?: string;
  declare pattern?: string;

  static readonly reflections: Reflection<EvCardHolder>[] = [
    ...CARD_FIELD,
    ["defaultValue", "text"],
    ["pattern", "text"],
  ];
}

reflect(EvCardHolder.prototype, EvCardHolder.reflections);

export class EvCardNumber extends EvCardFieldElement {
  declare iconPosition?: string;
  declare unsupportedBrandMessage?: string;

  static readonly reflections: Reflection<EvCardNumber>[] = [
    ...CARD_FIELD,
    ["iconPosition", "text"],
    ["unsupportedBrandMessage", "text"],
  ];
}

reflect(EvCardNumber.prototype, EvCardNumber.reflections);

export class EvCardExpiry extends EvCardFieldElement {
  static readonly reflections: Reflection<EvCardExpiry>[] = CARD_FIELD;
}

reflect(EvCardExpiry.prototype, EvCardExpiry.reflections);

export class EvCardExpiryMonth extends EvCardFieldElement {
  static readonly reflections: Reflection<EvCardExpiryMonth>[] = CARD_FIELD;
}

reflect(EvCardExpiryMonth.prototype, EvCardExpiryMonth.reflections);

export class EvCardExpiryYear extends EvCardFieldElement {
  static readonly reflections: Reflection<EvCardExpiryYear>[] = CARD_FIELD;
}

reflect(EvCardExpiryYear.prototype, EvCardExpiryYear.reflections);

export class EvCardCvc extends EvCardFieldElement {
  declare redact?: boolean;
  declare optional?: boolean;
  declare allow3DigitAmex?: boolean;

  static readonly reflections: Reflection<EvCardCvc>[] = [
    ...CARD_FIELD,
    ["redact", "flag"],
    ["optional", "flag"],
    ["allow3DigitAmex", "flag"],
  ];
}

reflect(EvCardCvc.prototype, EvCardCvc.reflections);

// The customer's own field: `autocomplete` takes a browser token too.
export class EvField extends FieldElement {
  declare name?: string;
  declare type?: string;
  declare defaultValue?: string;
  declare readOnly?: boolean;
  declare autoCapitalize?: string;
  declare spellCheck?: boolean;
  declare required?: boolean;
  declare minLength?: number;
  declare maxLength?: number;
  declare pattern?: string;
  declare min?: string;
  declare max?: string;
  declare step?: string;
  declare autoComplete?: string;

  static readonly reflections: Reflection<EvField>[] = [
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
  ];
}

reflect(EvField.prototype, EvField.reflections);

export class EvRow extends ElementBase {}

export const FIELD_ELEMENTS = {
  "ev-row": EvRow,
  "ev-card-holder": EvCardHolder,
  "ev-card-number": EvCardNumber,
  "ev-card-expiry": EvCardExpiry,
  "ev-card-expiry-month": EvCardExpiryMonth,
  "ev-card-expiry-year": EvCardExpiryYear,
  "ev-card-cvc": EvCardCvc,
  "ev-field": EvField,
};

export function registerFieldElements() {
  for (const [tag, element] of Object.entries(FIELD_ELEMENTS)) {
    if (!customElements.get(tag)) {
      customElements.define(tag, element);
    }
  }
}
