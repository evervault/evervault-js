import { forwardRef, useMemo } from "react";
import type { KeyboardTypeOptions } from "react-native";
import { customFieldInputId } from "shared/cardSpec";
import { customFieldProps } from "shared/customField";
import type { CustomFieldType } from "shared/customField";
import { fieldAttributes } from "shared/fieldProps";
import { AutoProgressProps, EvervaultInput } from "../Input";
import type { CardFieldBaseProps } from "./props";
import { customFieldKey } from "./customFields";
import { declaredField } from "./declaredFields";

export interface CardFieldProps extends CardFieldBaseProps, AutoProgressProps {
  /**
   * The key the field's encrypted value is reported under, in the payload's
   * `fields`.
   */
  name: string;

  /**
   * The kind of value the field takes, as HTML's input `type`. An `email`,
   * `url` or `number` value must be one.
   *
   * @default "text"
   */
  type?: "text" | "email" | "tel" | "url" | "number";

  /**
   * The value the field starts with. A changed default replaces only a value
   * the shopper hasn't changed.
   */
  defaultValue?: string;

  /**
   * Whether the shopper can't change the value. A read-only field is never
   * invalid.
   */
  readOnly?: boolean;

  /**
   * Whether the card is incomplete while the field is empty.
   */
  required?: boolean;

  /**
   * The shortest value the field takes.
   */
  minLength?: number;

  /**
   * The longest value the field takes. Auto-advance moves on once the field
   * holds this many characters.
   */
  maxLength?: number;

  /**
   * A pattern the whole value must match, as HTML's `pattern`.
   */
  pattern?: string;

  /**
   * The lowest `number` value the field takes, as HTML's `min`.
   */
  min?: string;

  /**
   * The highest `number` value the field takes, as HTML's `max`.
   */
  max?: string;

  /**
   * The steps a `number` value must keep to from `min`, as HTML's `step`.
   */
  step?: string;
}

// The props sent to the card, named as `<ev-field>`'s attributes.
const DECLARES = [
  "name",
  "type",
  "defaultValue",
  "readOnly",
  "required",
  "minLength",
  "maxLength",
  "pattern",
  "min",
  "max",
  "step",
  "errorMessage",
] as const satisfies readonly (keyof CardFieldProps)[];

const KEYBOARDS: Partial<Record<CustomFieldType, KeyboardTypeOptions>> = {
  email: "email-address",
  url: "url",
  tel: "phone-pad",
  number: "decimal-pad",
};

export type CardField = EvervaultInput;

const CardFieldElement = forwardRef<CardField, CardFieldProps>(
  function CardField(props, ref) {
    // Parsed as the card parses them, so a maxLength the card ignores (e.g. 1.5)
    // doesn't limit the input either.
    const declared = useMemo(
      () =>
        customFieldProps({
          type: "field",
          id: "",
          props: fieldAttributes(DECLARES, props, {}),
        }),
      [props]
    );

    const {
      name,
      type,
      defaultValue,
      readOnly,
      required,
      minLength,
      maxLength,
      pattern,
      min,
      max,
      step,
      errorMessage,
      ...input
    } = props;

    return (
      <EvervaultInput<Record<string, string>>
        id={customFieldInputId(name)}
        keyboardType={KEYBOARDS[declared?.type ?? "text"]}
        {...input}
        ref={ref}
        name={customFieldKey(name)}
        readOnly={readOnly}
        limit={declared?.maxLength}
      />
    );
  }
);

export const CardField = declaredField("field", CardFieldElement, DECLARES);
