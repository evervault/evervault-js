import type { CardFieldSettings } from "./cardFieldSettings";
import { inputFor } from "./cardSpec";
import type { CardInput } from "./cardSpec";
import { CARD_FIELD_ATTRIBUTES, FIELD_ATTRIBUTES } from "./fieldAttributes";
import type { FieldAttribute, FieldAttributeKind } from "./fieldAttributes";
import type { CardSpecNode } from "types/cardSpec";

export interface FieldProps extends CardFieldSettings {
  label?: string;
  placeholder?: string;
  tooltip?: string;
  iconPosition?: string;
  defaultValue?: string;
  autoComplete?: boolean;
  autoFocus?: boolean;
  autoProgress?: boolean;
  redact?: boolean;
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

// Attributes hold strings: a boolean prop is declared by `true` and denied by
// `false`, as `<ev-card>` reads them. A field's own prop wins over a fallback.
export function fieldAttributes(
  names: readonly string[],
  props: object,
  fallbacks: object
): Record<string, string> {
  const values = props as Record<string, unknown>;
  const defaults = fallbacks as Record<string, unknown>;

  return Object.fromEntries(
    names.flatMap((prop) => {
      const value = values[prop] ?? defaults[prop];
      // As `<ev-card>` names them: `autoProgress` is `autoprogress`.
      const attribute = prop.toLowerCase();

      if (value === undefined || value === null) return [];
      if (value === true) return [[attribute, ""]];
      return [[attribute, String(value)]];
    })
  );
}
