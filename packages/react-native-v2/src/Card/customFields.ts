import type { FieldError } from "react-hook-form";
import { CUSTOM_FIELD_ERRORS, customFieldError } from "shared/customField";
import type { CustomFieldProps } from "shared/customField";

// Encodes the name so "." or "__proto__" can't be read as a form path.
function encodedName(name: string): string {
  const encoded = name.replace(
    /[^A-Za-z0-9]/g,
    (character) => `_${character.charCodeAt(0).toString(16)}_`
  );

  return `k${encoded}`;
}

export function customFieldKey(name: string): string {
  return `fields.${encodedName(name)}`;
}

// The error text for a value, or null when it's valid.
export function customFieldMessage(
  value: string,
  field: CustomFieldProps
): string | null {
  const error = customFieldError(field, value);

  return error ? field.errorMessage ?? CUSTOM_FIELD_ERRORS[error] : null;
}

// Each Card.Field's error under its encoded name, as its value is stored in the
// form; null when there are none.
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
