import { CUSTOM_FIELD_TYPES } from "./customFieldTypes";
import type { CustomFieldType } from "./customFieldTypes";
import { unsupportedFieldType } from "./developerMessages";
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
  maxLength?: number;
  min?: string;
  max?: string;
  step?: string;
}

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
    maxLength: length(props.maxlength),
    min: props.min,
    max: props.max,
    step: props.step,
  };
}

// Why an <ev-field> renders differently from its declaration, if it does.
export function customFieldWarning(node: CardSpecNode): string | null {
  const { type } = node.props;

  if (type === undefined || isType(type.trim().toLowerCase())) return null;

  return unsupportedFieldType(node.props.name, type);
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
