export interface CustomFieldRules {
  type?: string;
  readOnly?: boolean;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: string;
  max?: string;
  step?: string;
}

export type CustomFieldError = "required" | "invalid";

export const CUSTOM_FIELD_ERRORS: Record<CustomFieldError, string> = {
  required: "This field is required",
  invalid: "Please enter a valid value",
};

// Anchored as in HTML; engines without the `v` flag fall back to `u`.
export function compilePattern(source: string): RegExp | undefined {
  for (const flags of ["v", "u"]) {
    try {
      return new RegExp(`^(?:${source})$`, flags);
    } catch {
      continue;
    }
  }

  return undefined;
}

export function validationRulesKey(field: CustomFieldRules): string {
  return JSON.stringify([
    field.type,
    field.required,
    field.readOnly,
    field.pattern?.source,
    field.minLength,
    field.maxLength,
    field.min,
    field.max,
    field.step,
  ]);
}

// The HTML standard's valid email address:
// https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address
const EMAIL =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const FLOAT = /^-?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/;
// The date picker's value is always yyyy-mm-dd, whatever the shopper's locale.
const DATE = /^(\d{4,})-(\d{2})-(\d{2})$/;
const DAY = 24 * 60 * 60 * 1000;

function parseNumber(value: string) {
  return FLOAT.test(value) ? Number(value) : null;
}

// A date as the days since 1970-01-01, the unit `step` counts it in.
function parseDate(value: string) {
  const match = DATE.exec(value);

  if (!match) return null;

  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);

  const exists =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return exists ? date.getTime() / DAY : null;
}

function isUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// As HTML applies them: a bad bound is ignored and a bad step becomes 1.
function withinRangeAndStep(
  field: CustomFieldRules,
  value: number,
  parse: typeof parseNumber
) {
  const min = field.min === undefined ? null : parse(field.min);
  const max = field.max === undefined ? null : parse(field.max);

  if (min !== null && value < min) return false;
  if (max !== null && value > max) return false;

  if (field.step?.trim().toLowerCase() === "any") return true;

  const declared = field.step === undefined ? null : parseNumber(field.step);
  const step = declared !== null && declared > 0 ? declared : 1;

  const steps = (value - (min ?? 0)) / step;

  // 1e-9 absorbs float rounding, so 0.3 with step 0.1 counts.
  return Math.abs(steps - Math.round(steps)) < 1e-9;
}

function matchesType(field: CustomFieldRules, value: string) {
  if (field.type === "email") return EMAIL.test(value);
  if (field.type === "url") return isUrl(value);

  if (field.type === "number" || field.type === "date") {
    const parse = field.type === "number" ? parseNumber : parseDate;
    const parsed = parse(value);

    return parsed !== null && withinRangeAndStep(field, parsed, parse);
  }

  return true;
}

export function customFieldError(
  field: CustomFieldRules,
  value: string
): CustomFieldError | undefined {
  // As in HTML, the customer cannot fix what they cannot edit.
  if (field.readOnly) return undefined;

  if (value.length === 0) return field.required ? "required" : undefined;

  if (field.type === "number" || field.type === "date") {
    return matchesType(field, value) ? undefined : "invalid";
  }

  const tooShort =
    field.minLength !== undefined && value.length < field.minLength;
  const tooLong =
    field.maxLength !== undefined && value.length > field.maxLength;

  if (tooShort || tooLong) return "invalid";
  if (field.pattern && !field.pattern.test(value)) return "invalid";

  return matchesType(field, value) ? undefined : "invalid";
}
