import { FIELD_ATTRIBUTES } from "./fieldAttributes";
import type { FieldAttributeKind } from "./fieldAttributes";
import { flag } from "./fieldProps";
import type { CardSpecNode } from "types/cardSpec";

export const CUSTOM_FIELD_TYPES = [
  "text",
  "email",
  "tel",
  "url",
  "number",
  "date",
] as const;

export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

export interface CustomFieldRules {
  type?: CustomFieldType;
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

export type AutoCapitalize = "none" | "sentences" | "words" | "characters";

export interface CustomFieldProps {
  name: string;
  type: CustomFieldType;
  label?: string;
  placeholder?: string;
  tooltip?: string;
  defaultValue?: string;
  autoComplete?: string;
  autoProgress?: boolean;
  readOnly?: boolean;
  inputMode?: string;
  autoCapitalize?: AutoCapitalize;
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

export function isCustomFieldType(
  value: string | undefined
): value is CustomFieldType {
  return (CUSTOM_FIELD_TYPES as readonly (string | undefined)[]).includes(
    value
  );
}

const SWITCH_WORDS = ["", "true", "on", "false", "off"];

// A switch word turns autofill on or off; any other token is passed through.
// https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill
function autoComplete(value: string) {
  if (!SWITCH_WORDS.includes(value.trim().toLowerCase())) return value;

  return flag(value, "off") ? "on" : "off";
}

type AutoCapitalizeAttribute =
  | "none"
  | "off"
  | "sentences"
  | "on"
  | "words"
  | "characters";

const AUTO_CAPITALIZE: Record<AutoCapitalizeAttribute, AutoCapitalize> = {
  none: "none",
  off: "none",
  sentences: "sentences",
  on: "sentences",
  words: "words",
  characters: "characters",
};

function isAutoCapitalizeAttribute(
  value: string
): value is AutoCapitalizeAttribute {
  return value in AUTO_CAPITALIZE;
}

function autoCapitalize(value: string | undefined) {
  const normalised = value?.trim().toLowerCase() ?? "";
  return isAutoCapitalizeAttribute(normalised)
    ? AUTO_CAPITALIZE[normalised]
    : undefined;
}

function parseLength(value: string | undefined) {
  if (value === undefined) return undefined;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

// The props whose parsing differs from their kind's.
const PARSE_BY_PROP: Partial<
  Record<keyof CustomFieldProps, (value: string) => unknown>
> = {
  autoComplete,
  autoCapitalize,
  minLength: parseLength,
  maxLength: parseLength,
  pattern: compilePattern,
};

// Parsed apart: name and type below, autofocus with the card fields' settings.
const PARSED_ELSEWHERE = new Set(["name", "type", "autoFocus"]);

export function customFieldProps(
  node: CardSpecNode
): CustomFieldProps | undefined {
  const { props } = node;

  if (!props.name) return undefined;

  const type = props.type?.trim().toLowerCase();

  const parse = (prop: keyof CustomFieldProps, kind: FieldAttributeKind) => {
    const value = props[prop.toLowerCase()];
    const parser = PARSE_BY_PROP[prop];

    if (value === undefined) return undefined;
    if (parser) return parser(value);
    return kind === "flag" ? flag(value) : value;
  };

  return {
    ...Object.fromEntries(
      FIELD_ATTRIBUTES.field
        .filter(([prop]) => !PARSED_ELSEWHERE.has(prop))
        .map(([prop, kind]) => [
          prop,
          parse(prop as keyof CustomFieldProps, kind),
        ])
    ),
    name: props.name,
    type: isCustomFieldType(type) ? type : "text",
  } as CustomFieldProps;
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
