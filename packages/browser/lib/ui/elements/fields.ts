import { ElementBase, adoptProperties, reflect } from "./reflect";
import type { Reflection } from "./reflect";

const COMMON: Reflection[] = [
  ["label", "label", "text"],
  ["placeholder", "placeholder", "text"],
  ["tooltip", "tooltip", "text"],
  ["autoFocus", "autofocus", "flag"],
  ["autoProgress", "autoprogress", "flag"],
  ["errorMessage", "errormessage", "text"],
];

const CARD_FIELD: Reflection[] = [
  ...COMMON,
  ["autoComplete", "autocomplete", "switch"],
];

// A field of the card: its settings are its attributes, readable and writable
// as properties.
class FieldElement extends ElementBase {
  declare label?: string;
  declare placeholder?: string;
  declare tooltip?: string;
  declare autoFocus?: boolean;
  declare autoProgress?: boolean;
  declare errorMessage?: string;

  static reflections: Reflection[] = COMMON;

  connectedCallback() {
    const { reflections } = this.constructor as typeof FieldElement;
    adoptProperties(
      this,
      reflections.map(([property]) => property)
    );
  }
}

class EvCardFieldElement extends FieldElement {
  declare autoComplete?: boolean;

  static reflections: Reflection[] = CARD_FIELD;
}

export class EvCardHolder extends EvCardFieldElement {
  declare defaultValue?: string;
  declare pattern?: string;

  static reflections: Reflection[] = [
    ...CARD_FIELD,
    ["defaultValue", "defaultvalue", "text"],
    ["pattern", "pattern", "text"],
  ];
}

reflect(EvCardHolder.prototype, EvCardHolder.reflections);

export class EvCardNumber extends EvCardFieldElement {
  declare iconPosition?: string;
  declare unsupportedBrandMessage?: string;

  static reflections: Reflection[] = [
    ...CARD_FIELD,
    ["iconPosition", "iconposition", "text"],
    ["unsupportedBrandMessage", "unsupportedbrandmessage", "text"],
  ];
}

reflect(EvCardNumber.prototype, EvCardNumber.reflections);

export class EvCardExpiry extends EvCardFieldElement {}

reflect(EvCardExpiry.prototype, EvCardExpiry.reflections);

export class EvCardExpiryMonth extends EvCardFieldElement {}

reflect(EvCardExpiryMonth.prototype, EvCardExpiryMonth.reflections);

export class EvCardExpiryYear extends EvCardFieldElement {}

reflect(EvCardExpiryYear.prototype, EvCardExpiryYear.reflections);

export class EvCardCvc extends EvCardFieldElement {
  declare redact?: boolean;
  declare optional?: boolean;
  declare allow3DigitAmex?: boolean;

  static reflections: Reflection[] = [
    ...CARD_FIELD,
    ["redact", "redact", "flag"],
    ["optional", "optional", "flag"],
    ["allow3DigitAmex", "allow3digitamex", "flag"],
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

  static reflections: Reflection[] = [
    ...COMMON,
    ["autoComplete", "autocomplete", "text"],
    ["name", "name", "text"],
    ["type", "type", "text"],
    ["defaultValue", "defaultvalue", "text"],
    ["readOnly", "readonly", "flag"],
    ["inputMode", "inputmode", "text"],
    ["autoCapitalize", "autocapitalize", "text"],
    ["spellCheck", "spellcheck", "flag"],
    ["enterKeyHint", "enterkeyhint", "text"],
    ["required", "required", "flag"],
    ["minLength", "minlength", "number"],
    ["maxLength", "maxlength", "number"],
    ["pattern", "pattern", "text"],
    ["min", "min", "text"],
    ["max", "max", "text"],
    ["step", "step", "text"],
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
