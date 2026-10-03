import { CARD_FIELD_ATTRIBUTES, FIELD_ATTRIBUTES } from "shared";
import type { FieldAttribute, FieldAttributeKind } from "shared";
import type { CardSpecNode } from "types";
import type { CardInput } from "./types";
import { inputFor } from "./useSpec";

export interface FieldProps {
  label?: string;
  placeholder?: string;
  tooltip?: string;
  iconPosition?: string;
  defaultValue?: string;
  autoComplete?: boolean;
  autoFocus?: boolean;
  autoProgress?: boolean;
  errorMessage?: string;
  unsupportedBrandMessage?: string;
  pattern?: string;
  redact?: boolean;
  optional?: boolean;
  allow3DigitAmex?: boolean;
}

// Declaring the attribute is what turns it on; only an explicit denial is false.
export function flag(value: string, ...denials: string[]) {
  return !["false", ...denials].includes(value.trim().toLowerCase());
}

const PARSE_BY_KIND: Record<FieldAttributeKind, (value: string) => unknown> = {
  text: (value) => value,
  flag: (value) => flag(value),
  switch: (value) => flag(value, "off"),
  number: Number,
};

// A custom field's own attributes are read by customFieldProps; here, only
// those it shares with the card fields.
function attributesOf(type: CardSpecNode["type"]): readonly FieldAttribute[] {
  if (type === "row") return [];
  if (type === "field") return CARD_FIELD_ATTRIBUTES;
  return FIELD_ATTRIBUTES[type];
}

export function fieldProps(node: CardSpecNode): FieldProps {
  return Object.fromEntries(
    attributesOf(node.type)
      .map(([prop, kind]) => [prop, kind, prop.toLowerCase()] as const)
      .filter(([, , attribute]) => attribute in node.props)
      .map(([prop, kind, attribute]) => [
        prop,
        PARSE_BY_KIND[kind](node.props[attribute]),
      ])
  ) as FieldProps;
}

// The node claiming each input, in declared order: the first of a type wins.
export function declaredProps(
  nodes: CardSpecNode[]
): Map<CardInput, FieldProps> {
  const declared = new Map<CardInput, FieldProps>();

  const walk = (node: CardSpecNode) => {
    if (node.type === "row") {
      (node.children ?? []).forEach(walk);
      return;
    }

    const input = inputFor(node);

    if (!input || declared.has(input)) return;

    declared.set(input, fieldProps(node));
  };

  nodes.forEach(walk);

  return declared;
}
