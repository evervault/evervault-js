import * as React from "react";
import type { CardFieldMap, CardOptions } from "types";

export interface CardFieldBaseProps {
  /**
   * Text shown above the field, in place of the card's own label.
   */
  label?: string;

  /**
   * Text shown in the field while it is empty, in place of the card's own.
   */
  placeholder?: string;

  /**
   * Text shown in a tooltip next to the field's label.
   */
  tooltip?: string;

  /**
   * Whether the browser may autofill the field.
   *
   * @default true
   */
  autoComplete?: boolean;

  /**
   * Whether the field takes focus when the card mounts.
   */
  autoFocus?: boolean;

  /**
   * Whether to move focus to the next field once this one is filled. Overrides
   * the card's `autoProgress` for this field.
   */
  autoProgress?: boolean;

  /**
   * Replaces the text of the error shown under this field.
   */
  errorMessage?: string;
}

export interface CardRowProps {
  children?: React.ReactNode;
}

export interface CardNumberProps extends CardFieldBaseProps {
  /**
   * Where the card brand's icon sits in the field, for the theme to place it.
   */
  iconPosition?: string;

  /**
   * Replaces the text of the error for a card whose brand the card does not
   * accept.
   */
  unsupportedBrandMessage?: string;
}

export type CardExpiryProps = CardFieldBaseProps;

export type CardExpiryMonthProps = CardFieldBaseProps;

export type CardExpiryYearProps = CardFieldBaseProps;

export interface CardCvcProps extends CardFieldBaseProps {
  /**
   * Whether to hide the security code's digits as they are typed.
   */
  redact?: boolean;

  /**
   * Whether the card is complete without a security code.
   *
   * @default false
   */
  optional?: boolean;

  /**
   * Whether an American Express security code may be 3 digits rather than 4.
   *
   * @default true
   */
  allow3DigitAmex?: boolean;
}

export interface CardHolderProps extends CardFieldBaseProps {
  /**
   * The name the field starts with. A changed default replaces only a name
   * the shopper hasn't changed.
   */
  defaultValue?: string;

  /**
   * A pattern the whole name must match, as HTML's `pattern`.
   */
  pattern?: string;
}

export interface CardFieldProps {
  /**
   * The key the field's encrypted value is reported under, in the payload's
   * `fields`.
   */
  name: string;

  /**
   * The kind of value the field takes, as HTML's input `type`. An `email`,
   * `url`, `number` or `date` value must be one.
   *
   * @default "text"
   */
  type?: "text" | "email" | "tel" | "url" | "number" | "date";

  /**
   * Text shown above the field.
   */
  label?: string;

  /**
   * Text shown in the field while it is empty.
   */
  placeholder?: string;

  /**
   * Text shown in a tooltip next to the field's label.
   */
  tooltip?: string;

  /**
   * The value the field starts with. A changed default replaces only a value
   * the shopper hasn't changed.
   */
  defaultValue?: string;

  /**
   * `true` or `false` turns autofill on or off. A string, such as
   * `postal-code`, tells the browser what the field is for.
   */
  autoComplete?: boolean | string;

  /**
   * Whether the field takes focus when the card mounts.
   */
  autoFocus?: boolean;

  /**
   * Whether to move focus to the next field once this one holds its
   * `maxLength`. Overrides the card's `autoProgress` for this field.
   */
  autoProgress?: boolean;

  /**
   * Whether the shopper can't change the value. A read-only field is never
   * invalid.
   */
  readOnly?: boolean;

  /**
   * The keyboard to show for the field, as HTML's `inputmode`.
   */
  inputMode?: string;

  /**
   * Which letters to capitalize as the shopper types, as HTML's
   * `autocapitalize`.
   */
  autoCapitalize?: "none" | "sentences" | "words" | "characters";

  /**
   * Whether the browser checks the field's spelling, as HTML's `spellcheck`.
   */
  spellCheck?: boolean;

  /**
   * The label of the keyboard's enter key, as HTML's `enterkeyhint`.
   */
  enterKeyHint?: string;

  /**
   * Whether the card is incomplete while the field is empty.
   */
  required?: boolean;

  /**
   * The shortest value the field takes.
   */
  minLength?: number;

  /**
   * The longest value the field takes.
   */
  maxLength?: number;

  /**
   * A pattern the whole value must match, as HTML's `pattern`.
   */
  pattern?: string;

  /**
   * The lowest `number` or `date` value the field takes, as HTML's `min`.
   */
  min?: string;

  /**
   * The highest `number` or `date` value the field takes, as HTML's `max`.
   */
  max?: string;

  /**
   * The steps a `number` or `date` value must keep to from `min`, as HTML's
   * `step`.
   */
  step?: string;

  /**
   * Replaces the text of the error shown under this field.
   */
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
