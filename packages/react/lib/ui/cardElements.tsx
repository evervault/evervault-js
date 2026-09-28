import * as React from "react";

export interface CardFieldProps {
  label?: string;
  placeholder?: string;
  tooltip?: string;
  autoComplete?: boolean;
  autoFocus?: boolean;
}

export interface CardRowProps {
  children?: React.ReactNode;
}

export interface CardNumberProps extends CardFieldProps {
  iconPosition?: string;
}

export type CardExpiryProps = CardFieldProps;

export type CardExpiryMonthProps = CardFieldProps;

export type CardExpiryYearProps = CardFieldProps;

export interface CardCvcProps extends CardFieldProps {
  redact?: boolean;
  optional?: boolean;
}

export interface CardHolderProps extends CardFieldProps {
  defaultValue?: string;
}

export interface CardCustomFieldProps {
  name: string;
  type?: "text" | "email" | "tel" | "url" | "number" | "date";
  label?: string;
  placeholder?: string;
  tooltip?: string;
  defaultValue?: string;
  // `true`/`false` turn autofill on or off; a string is a browser token.
  autoComplete?: boolean | string;
  autoFocus?: boolean;
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

// The prop each attribute of the `<ev-card-*>` element is read from.
const COMMON: Record<string, string> = {
  label: "label",
  placeholder: "placeholder",
  tooltip: "tooltip",
  autocomplete: "autoComplete",
  autofocus: "autoFocus",
};

const CUSTOM_FIELD: Record<string, string> = {
  ...COMMON,
  name: "name",
  type: "type",
  defaultvalue: "defaultValue",
  readonly: "readOnly",
  inputmode: "inputMode",
  autocapitalize: "autoCapitalize",
  spellcheck: "spellCheck",
  enterkeyhint: "enterKeyHint",
  required: "required",
  minlength: "minLength",
  maxlength: "maxLength",
  pattern: "pattern",
  min: "min",
  max: "max",
  step: "step",
  errormessage: "errorMessage",
};

// Attributes hold strings: a boolean prop is declared by `true` and denied by
// `false`, as `<ev-card>` reads them.
export function attributes(
  names: Record<string, string>,
  props: object
): Record<string, string> {
  const values = props as Record<string, unknown>;

  return Object.fromEntries(
    Object.entries(names).flatMap(([attribute, prop]) => {
      const value = values[prop];

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

function field<P extends object>(tag: string, names: Record<string, string>) {
  return function CardField(props: P) {
    const ref = React.useRef<HTMLElement | null>(null);
    useAttributes(ref, attributes(names, props));

    return React.createElement(tag, { ref });
  };
}

export function CardRow({ children }: CardRowProps) {
  return React.createElement("ev-row", null, children);
}

export const CardHolder = field<CardHolderProps>("ev-card-holder", {
  ...COMMON,
  defaultvalue: "defaultValue",
});

export const CardNumber = field<CardNumberProps>("ev-card-number", {
  ...COMMON,
  iconposition: "iconPosition",
});

export const CardExpiry = field<CardExpiryProps>("ev-card-expiry", COMMON);

export const CardExpiryMonth = field<CardExpiryMonthProps>(
  "ev-card-expiry-month",
  COMMON
);

export const CardExpiryYear = field<CardExpiryYearProps>(
  "ev-card-expiry-year",
  COMMON
);

export const CardCvc = field<CardCvcProps>("ev-card-cvc", {
  ...COMMON,
  redact: "redact",
  optional: "optional",
});

export const CardCustomField = field<CardCustomFieldProps>(
  "ev-field",
  CUSTOM_FIELD
);
