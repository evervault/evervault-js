import type { FieldError } from "react-hook-form";
import { CUSTOM_FIELD_ERRORS, customFieldError } from "shared/customField";
import type { CustomFieldProps } from "shared/customField";

// The key a Card.Field's value is kept under in the form's `fields`. Any name
// is kept, even one with a "." or one such as "__proto__", which the form
// would read as a path.
function encodedName(name: string): string {
  const encoded = name.replace(
    /[^A-Za-z0-9]/g,
    (character) => `_${character.charCodeAt(0).toString(16)}_`
  );

  return `k${encoded}`;
}

// The form path a Card.Field's value is kept under.
export function customFieldKey(name: string): string {
  return `fields.${encodedName(name)}`;
}

// Why a value breaks its field's rules, or null when it keeps them.
export function customFieldMessage(
  value: string,
  field: CustomFieldProps
): string | null {
  const error = customFieldError(field, value);

  return error ? field.errorMessage ?? CUSTOM_FIELD_ERRORS[error] : null;
}

// Each Card.Field's error, as the form keeps it under `fields`, or null when
// no field has one.
export function customFieldErrors(
  values: object,
  fields: ReadonlyMap<string, CustomFieldProps>
): Record<string, FieldError> | null {
  const typed = (values as { fields?: Record<string, string | undefined> })
    .fields;
  const errors: Record<string, FieldError> = {};

  for (const [name, field] of fields) {
    const key = encodedName(name);
    const message = customFieldMessage(typed?.[key] ?? "", field);
    if (message) errors[key] = { type: "custom", message };
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
