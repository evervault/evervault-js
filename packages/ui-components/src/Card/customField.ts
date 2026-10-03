import { CUSTOM_FIELD_TYPES } from "./customFieldTypes";
import type { CustomFieldType } from "./customFieldTypes";
import { invalidPattern, unsupportedFieldType } from "./developerMessages";
import { flag } from "./props";
import type { CardSpecNode } from "types";

export type AutoCapitalize = "none" | "sentences" | "words" | "characters";

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

export type CustomFieldError = "required" | "invalid";

function isType(value: string | undefined): value is CustomFieldType {
  return (CUSTOM_FIELD_TYPES as readonly (string | undefined)[]).includes(
    value
  );
}

const SWITCH_WORDS = ["", "true", "on", "false", "off"];

// <ev-field autocomplete="postal-code"> tells the browser what the field is for,
// so the value is passed straight through. If autocomplete is one of
// SWITCH_WORDS, it returns on or off.
// https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill
function autoComplete(value: string) {
  // A browser token such as "postal-code" goes to the input unchanged.
  if (!SWITCH_WORDS.includes(value.trim().toLowerCase())) return value;

  // "false" and "off" turn autofill off; "", "true" and "on" turn it on.
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

// minlength/maxlength: a whole number of 0 or more; anything else is invalid
// and becomes undefined.
function parseLength(value: string | undefined) {
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
    autoCapitalize: autoCapitalize(props.autocapitalize),
    spellCheck: read("spellcheck", flag),
    enterKeyHint: props.enterkeyhint,
    required: read("required", flag),
    minLength: parseLength(props.minlength),
    maxLength: parseLength(props.maxlength),
    pattern: read("pattern", compilePattern),
    min: props.min,
    max: props.max,
    step: props.step,
    errorMessage: props.errormessage,
  };
}

const WORD_START = /(^|\s)(\p{Ll})/gu;
const SENTENCE_START = /(^\s*|[.!?]\s+)(\p{Ll})/gu;

// Browsers capitalise only on virtual keyboards, and never an email or a url.
export function capitalised(field: CustomFieldProps, value: string): string {
  if (field.type !== "text" && field.type !== "tel") return value;

  const upper = (_: string, before: string, letter: string) =>
    before + letter.toUpperCase();

  if (field.autoCapitalize === "characters") return value.toUpperCase();
  if (field.autoCapitalize === "words") return value.replace(WORD_START, upper);
  if (field.autoCapitalize === "sentences") {
    return value.replace(SENTENCE_START, upper);
  }

  return value;
}

// Turns a field's rules into one string, so two sets of rules can be compared
// with ===.
export function validationRulesKey(field: CustomFieldProps): string {
  // Everything that decides whether a value is valid.
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

// The HTML standard's valid email address:
// https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address
const EMAIL =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const FLOAT = /^-?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/;
// The browser's date picker shows dates in the shopper's locale, but the value
// it gives back is always yyyy-mm-dd.
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

// min, max and step as HTML applies them: a bad bound is ignored, a bad step
// becomes 1, and "any" allows any step.
function withinRangeAndStep(
  field: CustomFieldProps,
  value: number,
  parse: typeof parseNumber
) {
  // A min or max that isn't a valid number or date is null, and ignored.
  const min = field.min === undefined ? null : parse(field.min);
  const max = field.max === undefined ? null : parse(field.max);

  // Below min or above max is out of range.
  if (min !== null && value < min) return false;
  if (max !== null && value > max) return false;

  // step="any" allows any value in range.
  if (field.step?.trim().toLowerCase() === "any") return true;

  // No step, or one that isn't a positive number, becomes 1.
  const declared = field.step === undefined ? null : parseNumber(field.step);
  const step = declared !== null && declared > 0 ? declared : 1;

  // How many steps the value is from min (or from 0 without a min).
  const steps = (value - (min ?? 0)) / step;

  // Valid only on a whole number of steps; 1e-9 absorbs float rounding, so 0.3
  // with step 0.1 counts.
  return Math.abs(steps - Math.round(steps)) < 1e-9;
}

function matchesType(field: CustomFieldProps, value: string) {
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
