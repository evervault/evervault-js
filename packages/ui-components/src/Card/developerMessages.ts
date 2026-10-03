import { CUSTOM_FIELD_TYPES } from "./customFieldTypes";
import type { CardSpecNode, ExpiryHalf } from "types";

// What the card logs for the developer, shared with the tests that check it.

export function duplicateField(type: CardSpecNode["type"]) {
  return `<ev-card> ignored a duplicate "${type}" field.`;
}

export const COMBINED_EXPIRY_WITH_HALF =
  '<ev-card> declares an "expiry" field alongside a split expiry. Declare the combined field or the two halves, not both.';

export function loneExpiryHalf(declared: ExpiryHalf) {
  const missing = declared === "expiryMonth" ? "expiryYear" : "expiryMonth";
  return `<ev-card> declares an "${declared}" field without an "${missing}" field. A split expiry needs both halves.`;
}

export const NAMELESS_CUSTOM_FIELD =
  "<ev-card> ignored an <ev-field> without a name.";

export function duplicateCustomField(name: string) {
  return `<ev-card> ignored a second <ev-field> named "${name}".`;
}

export function unsupportedFieldType(name: string | undefined, type: string) {
  const types = CUSTOM_FIELD_TYPES.map((type) => `"${type}"`).join(", ");
  return `<ev-card> renders the <ev-field> named "${name}" as a "text" field: "${type}" is not a type it supports. Types are: ${types}.`;
}

export function invalidPattern(name: string | undefined, pattern: string) {
  return `<ev-card> ignores the pattern of the <ev-field> named "${name}": "${pattern}" is not a valid regular expression.`;
}

// Why a declared node was left out of the card.
export function skippedFieldWarning(node: CardSpecNode) {
  if (node.type !== "field") return duplicateField(node.type);

  return node.props.name
    ? duplicateCustomField(node.props.name)
    : NAMELESS_CUSTOM_FIELD;
}
