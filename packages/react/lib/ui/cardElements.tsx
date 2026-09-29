import * as React from "react";

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
const COMMON = [
  "label",
  "placeholder",
  "tooltip",
  "autoComplete",
  "autoFocus",
  "autoProgress",
  "errorMessage",
];

const CUSTOM_FIELD = [
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

// Attributes hold strings: a boolean prop is declared by `true` and denied by
// `false`, as `<ev-card>` reads them.
export function attributes(
  names: string[],
  props: object
): Record<string, string> {
  const values = props as Record<string, unknown>;

  return Object.fromEntries(
    names.flatMap((prop) => {
      const value = values[prop];
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

function field<P extends object>(tag: string, names: string[]) {
  return function CardField(props: P) {
    const ref = React.useRef<HTMLElement | null>(null);
    useAttributes(ref, attributes(names, props));

    return React.createElement(tag, { ref });
  };
}

export function CardRow({ children }: CardRowProps) {
  return React.createElement("ev-row", null, children);
}

export const CardHolder = field<CardHolderProps>("ev-card-holder", [
  ...COMMON,
  "defaultValue",
  "pattern",
]);

export const CardNumber = field<CardNumberProps>("ev-card-number", [
  ...COMMON,
  "iconPosition",
  "unsupportedBrandMessage",
]);

export const CardExpiry = field<CardExpiryProps>("ev-card-expiry", COMMON);

export const CardExpiryMonth = field<CardExpiryMonthProps>(
  "ev-card-expiry-month",
  COMMON
);

export const CardExpiryYear = field<CardExpiryYearProps>(
  "ev-card-expiry-year",
  COMMON
);

export const CardCvc = field<CardCvcProps>("ev-card-cvc", [
  ...COMMON,
  "redact",
  "optional",
  "allow3DigitAmex",
]);

export const CardCustomField = field<CardFieldProps>("ev-field", CUSTOM_FIELD);
