import * as React from "react";
import type { CardFieldMap, CardOptions } from "types";

export interface CardFieldBaseProps {
  label?: string;
  placeholder?: string;
  tooltip?: string;
  autoComplete?: boolean;
  autoFocus?: boolean;
  autoProgress?: boolean;
  errorMessage?: string;
}

export interface CardRowProps {
  children?: React.ReactNode;
}

export interface CardNumberProps extends CardFieldBaseProps {
  iconPosition?: string;
  unsupportedBrandMessage?: string;
}

export type CardExpiryProps = CardFieldBaseProps;

export type CardExpiryMonthProps = CardFieldBaseProps;

export type CardExpiryYearProps = CardFieldBaseProps;

export interface CardCvcProps extends CardFieldBaseProps {
  redact?: boolean;
  optional?: boolean;
  allow3DigitAmex?: boolean;
}

export interface CardHolderProps extends CardFieldBaseProps {
  defaultValue?: string;
  pattern?: string;
}

export interface CardFieldProps {
  name: string;
  type?: "text" | "email" | "tel" | "url" | "number" | "date";
  label?: string;
  placeholder?: string;
  tooltip?: string;
  defaultValue?: string;
  // `true`/`false` turn autofill on or off; a string is a browser token.
  autoComplete?: boolean | string;
  autoFocus?: boolean;
  autoProgress?: boolean;
  readOnly?: boolean;
  inputMode?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  spellCheck?: boolean;
  enterKeyHint?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: string;
  max?: string;
  step?: string;
  errorMessage?: string;
}

// The props each `<ev-card-*>` element takes as its attributes.
const COMMON: (keyof CardFieldBaseProps)[] = [
  "label",
  "placeholder",
  "tooltip",
  "autoComplete",
  "autoFocus",
  "autoProgress",
  "errorMessage",
];

const CUSTOM_FIELD: (keyof CardFieldProps)[] = [
  ...COMMON,
  "name",
  "type",
  "defaultValue",
  "readOnly",
  "inputMode",
  "autoCapitalize",
  "spellCheck",
  "enterKeyHint",
  "required",
  "minLength",
  "maxLength",
  "pattern",
  "min",
  "max",
  "step",
];

// The deprecated card props a declared card's fields fall back on.
export type DeprecatedCardProps = Pick<
  CardOptions,
  "autoComplete" | "redactCVC" | "allow3DigitAmexCVC"
>;

export const DeprecatedCardContext = React.createContext<DeprecatedCardProps>(
  {}
);

// Attributes hold strings: a boolean prop is declared by `true` and denied by
// `false`, as `<ev-card>` reads them. A field's own prop wins over a fallback.
function attributes(
  names: readonly string[],
  props: object,
  fallbacks: object
): Record<string, string> {
  const values = props as Record<string, unknown>;
  const defaults = fallbacks as Record<string, unknown>;

  return Object.fromEntries(
    names.flatMap((prop) => {
      const value = values[prop] ?? defaults[prop];
      // As `<ev-card>` names them: `autoProgress` is `autoprogress`.
      const attribute = prop.toLowerCase();

      if (value === undefined || value === null) return [];
      if (value === true) return [[attribute, ""]];
      return [[attribute, String(value)]];
    })
  );
}

// Written by hand: given them as props, React 19 sets `autofocus` and
// `spellcheck` as the element's properties, which read "" as false.
function useAttributes(
  ref: React.RefObject<HTMLElement | null>,
  declared: Record<string, string>
) {
  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    for (const { name } of [...element.attributes]) {
      if (!(name in declared)) element.removeAttribute(name);
    }

    for (const [name, value] of Object.entries(declared)) {
      if (element.getAttribute(name) !== value) {
        element.setAttribute(name, value);
      }
    }
  });
}

function fieldElement<P extends object>(
  displayName: string,
  tag: string,
  names: readonly (keyof P & string)[],
  fallbacks: (deprecated: DeprecatedCardProps, props: P) => Partial<P>
) {
  function Component(props: P) {
    const ref = React.useRef<HTMLElement | null>(null);
    const deprecated = React.useContext(DeprecatedCardContext);
    useAttributes(ref, attributes(names, props, fallbacks(deprecated, props)));

    return React.createElement(tag, { ref });
  }

  Component.displayName = displayName;
  return Component;
}

// A field's setting from a deprecated `autoComplete` map by field: its own
// key first, then the key it shares.
function autoCompleteFor(
  ...keys: Exclude<keyof CardFieldMap<boolean>, "fields">[]
) {
  return ({ autoComplete }: DeprecatedCardProps) => ({
    autoComplete:
      typeof autoComplete === "object"
        ? keys
            .map((key) => autoComplete[key])
            .find((setting) => setting !== undefined)
        : undefined,
  });
}

export function CardRow({ children }: CardRowProps) {
  return React.createElement("ev-row", null, children);
}

CardRow.displayName = "Card.Row";

export const CardHolder = fieldElement<CardHolderProps>(
  "Card.Holder",
  "ev-card-holder",
  [...COMMON, "defaultValue", "pattern"],
  autoCompleteFor("name")
);

export const CardNumber = fieldElement<CardNumberProps>(
  "Card.Number",
  "ev-card-number",
  [...COMMON, "iconPosition", "unsupportedBrandMessage"],
  autoCompleteFor("number")
);

export const CardExpiry = fieldElement<CardExpiryProps>(
  "Card.Expiry",
  "ev-card-expiry",
  COMMON,
  autoCompleteFor("expiry")
);

export const CardExpiryMonth = fieldElement<CardExpiryMonthProps>(
  "Card.ExpiryMonth",
  "ev-card-expiry-month",
  COMMON,
  autoCompleteFor("expiryMonth", "expiry")
);

export const CardExpiryYear = fieldElement<CardExpiryYearProps>(
  "Card.ExpiryYear",
  "ev-card-expiry-year",
  COMMON,
  autoCompleteFor("expiryYear", "expiry")
);

export const CardCvc = fieldElement<CardCvcProps>(
  "Card.Cvc",
  "ev-card-cvc",
  [...COMMON, "redact", "optional", "allow3DigitAmex"],
  (deprecated) => ({
    ...autoCompleteFor("cvc")(deprecated),
    redact: deprecated.redactCVC,
    allow3DigitAmex: deprecated.allow3DigitAmexCVC,
  })
);

export const CardField = fieldElement<CardFieldProps>(
  "Card.Field",
  "ev-field",
  CUSTOM_FIELD,
  ({ autoComplete }, { name }) => {
    const setting =
      typeof autoComplete === "object" ? autoComplete.fields : undefined;

    // One setting for every custom field, or one per field by name.
    return {
      autoComplete: typeof setting === "object" ? setting[name] : setting,
    };
  }
);
