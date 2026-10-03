// The input types an <ev-field> renders as.
export const CUSTOM_FIELD_TYPES = [
  "text",
  "email",
  "tel",
  "url",
  "number",
  "date",
] as const;

export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];
