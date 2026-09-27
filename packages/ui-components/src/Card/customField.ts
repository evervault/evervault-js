import { CUSTOM_FIELD_TYPES } from "./customFieldTypes";
import type { CustomFieldType } from "./customFieldTypes";
import { invalidPattern, unsupportedFieldType } from "./developerMessages";
import { flag } from "./props";
import type { CardSpecNode } from "types";

export interface CustomFieldProps {
  name: string;
  type: CustomFieldType;
  label?: string;
  placeholder?: string;
  tooltip?: string;
  defaultValue?: string;
  autoComplete?: string;
  readOnly?: boolean;
  inputMode?: string;
  autoCapitalize?: string;
  spellCheck?: boolean;
  enterKeyHint?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: string;
  max?: string;
  step?: string;
  errorMessage?: string;
}

export type CustomFieldError = "required" | "invalid";

function isType(value: string | undefined): value is CustomFieldType {
  return (CUSTOM_FIELD_TYPES as readonly (string | undefined)[]).includes(
    value
  );
}

// Bare or "true" turns autofill on; any value but a denial is a browser token.
function autoComplete(value: string) {
  const normalised = value.trim().toLowerCase();

  if (["", "true", "on"].includes(normalised)) return "on";
  if (["false", "off"].includes(normalised)) return "off";
  return value;
}

function length(value: string | undefined) {
  if (value === undefined) return undefined;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

// Anchored as in HTML; engines without the `v` flag fall back to `u`.
function compilePattern(source: string): RegExp | undefined {
  for (const flags of ["v", "u"]) {
    try {
      return new RegExp(`^(?:${source})$`, flags);
    } catch {
      continue;
    }
  }

  return undefined;
}

export function customFieldProps(
  node: CardSpecNode
): CustomFieldProps | undefined {
  const { props } = node;

  if (!props.name) return undefined;

  const read = <T>(attribute: string, parse: (value: string) => T) =>
    attribute in props ? parse(props[attribute]) : undefined;

  const type = props.type?.trim().toLowerCase();

  return {
    name: props.name,
    type: isType(type) ? type : "text",
    label: props.label,
    placeholder: props.placeholder,
    tooltip: props.tooltip,
    defaultValue: props.defaultvalue,
    autoComplete: read("autocomplete", autoComplete),
    readOnly: read("readonly", flag),
    inputMode: props.inputmode,
    autoCapitalize: props.autocapitalize,
    spellCheck: read("spellcheck", flag),
    enterKeyHint: props.enterkeyhint,
    required: read("required", flag),
    minLength: length(props.minlength),
    maxLength: length(props.maxlength),
    pattern: read("pattern", compilePattern),
    min: props.min,
    max: props.max,
    step: props.step,
    errorMessage: props.errormessage,
  };
}

// The rules a value is judged by, as one comparable key.
export function customFieldRules(field: CustomFieldProps): string {
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

// Why an <ev-field> behaves differently from its declaration, if it does.
export function customFieldWarnings(node: CardSpecNode): string[] {
  const { name, type, pattern } = node.props;
  const warnings: string[] = [];

  if (type !== undefined && !isType(type.trim().toLowerCase())) {
    warnings.push(unsupportedFieldType(name, type));
  }

  if (pattern !== undefined && !compilePattern(pattern)) {
    warnings.push(invalidPattern(name, pattern));
  }

  return warnings;
}

// The HTML definition of a valid email address.
const EMAIL =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const FLOAT = /^-?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/;
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

// A bound or step that does not parse is no constraint, as in HTML.
function inRange(
  field: CustomFieldProps,
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

  return Math.abs(steps - Math.round(steps)) < 1e-9;
}

function matchesType(field: CustomFieldProps, value: string) {
  if (field.type === "email") return EMAIL.test(value);
  if (field.type === "url") return isUrl(value);

  if (field.type === "number" || field.type === "date") {
    const parse = field.type === "number" ? parseNumber : parseDate;
    const parsed = parse(value);

    return parsed !== null && inRange(field, parsed, parse);
  }

  return true;
}

export function customFieldError(
  field: CustomFieldProps,
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

export function customFieldNodes(nodes: CardSpecNode[]): CardSpecNode[] {
  return nodes.flatMap((node) => {
    if (node.type === "row") return customFieldNodes(node.children ?? []);
    return node.type === "field" ? [node] : [];
  });
}

// The <ev-field> claiming each name, in declared order: the first wins.
export function declaredCustomFields(
  nodes: CardSpecNode[]
): Map<string, CustomFieldProps> {
  const declared = new Map<string, CustomFieldProps>();

  customFieldNodes(nodes).forEach((node) => {
    const props = customFieldProps(node);

    if (props && !declared.has(props.name)) declared.set(props.name, props);
  });

  return declared;
}
