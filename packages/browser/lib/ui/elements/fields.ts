import { ElementBase, adoptProperties, reflect } from "./reflect";
import type { Reflection, ReflectionKind } from "./reflect";
import { FIELD_ATTRIBUTES } from "shared/fieldAttributes";

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

// An element's reflections from its attributes in the shared table, each one
// checked against the element's own properties.
function reflectionsOf<E extends Element>(
  attributes: readonly (readonly [keyof E & string, ReflectionKind])[]
): Reflection<E>[] {
  return attributes.map(([property, kind]) => [property, kind]);
}

class EvCardFieldElement extends FieldElement {
  declare autoComplete?: boolean;
}

export class EvCardHolder extends EvCardFieldElement {
  declare defaultValue?: string;
  declare pattern?: string;

  static readonly reflections = reflectionsOf<EvCardHolder>(
    FIELD_ATTRIBUTES.name
  );
}

reflect(EvCardHolder.prototype, EvCardHolder.reflections);

export class EvCardNumber extends EvCardFieldElement {
  declare iconPosition?: string;
  declare unsupportedBrandMessage?: string;

  static readonly reflections = reflectionsOf<EvCardNumber>(
    FIELD_ATTRIBUTES.number
  );
}

reflect(EvCardNumber.prototype, EvCardNumber.reflections);

export class EvCardExpiry extends EvCardFieldElement {
  static readonly reflections = reflectionsOf<EvCardExpiry>(
    FIELD_ATTRIBUTES.expiry
  );
}

reflect(EvCardExpiry.prototype, EvCardExpiry.reflections);

export class EvCardExpiryMonth extends EvCardFieldElement {
  static readonly reflections = reflectionsOf<EvCardExpiryMonth>(
    FIELD_ATTRIBUTES.expiryMonth
  );
}

reflect(EvCardExpiryMonth.prototype, EvCardExpiryMonth.reflections);

export class EvCardExpiryYear extends EvCardFieldElement {
  static readonly reflections = reflectionsOf<EvCardExpiryYear>(
    FIELD_ATTRIBUTES.expiryYear
  );
}

reflect(EvCardExpiryYear.prototype, EvCardExpiryYear.reflections);

export class EvCardCvc extends EvCardFieldElement {
  declare redact?: boolean;
  declare optional?: boolean;
  declare allow3DigitAmex?: boolean;

  static readonly reflections = reflectionsOf<EvCardCvc>(FIELD_ATTRIBUTES.cvc);
}

reflect(EvCardCvc.prototype, EvCardCvc.reflections);

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

  static readonly reflections = reflectionsOf<EvField>(FIELD_ATTRIBUTES.field);
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
