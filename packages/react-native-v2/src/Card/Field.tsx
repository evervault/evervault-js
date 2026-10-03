import { forwardRef, useContext, useId, useLayoutEffect } from "react";
import {
  AutoProgressProps,
  BaseEvervaultInputProps,
  EvervaultInput,
} from "../Input";
import { CustomFieldRules, CustomFieldsContext } from "./customFields";
import { declaredField } from "./declaredFields";

export interface CardFieldProps
  extends BaseEvervaultInputProps,
    AutoProgressProps,
    CustomFieldRules {
  /**
   * The key the field's encrypted value is reported under, in the payload's
   * `fields`.
   */
  name: string;
}

export type CardField = EvervaultInput;

const CardFieldElement = forwardRef<CardField, CardFieldProps>(
  function CardField(
    { name, required, minLength, maxLength, pattern, errorMessage, ...props },
    ref
  ) {
    const { set, remove } = useContext(CustomFieldsContext);
    const id = useId();

    // Removed only on unmount, so a changed rule keeps the field's place.
    useLayoutEffect(() => () => remove(id), [remove, id]);

    useLayoutEffect(
      () =>
        set(id, name, {
          required,
          minLength,
          maxLength,
          pattern,
          errorMessage,
        }),
      [set, id, name, required, minLength, maxLength, pattern, errorMessage]
    );

    return (
      <EvervaultInput<Record<string, string>>
        id={`field-${name}`}
        {...props}
        ref={ref}
        name={`fields.${name}`}
        limit={maxLength}
      />
    );
  }
);

export const CardField = declaredField(
  "field",
  CardFieldElement,
  (props) => props.name
);
