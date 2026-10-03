import { CUSTOM_FIELD_TYPES } from "./customFieldTypes";
import type { CustomFieldType } from "./customFieldTypes";
import { invalidPattern, unsupportedFieldType } from "./developerMessages";
import { flag } from "./props";
import { compilePattern } from "shared";
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
    autoProgress: read("autoprogress", flag),
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
