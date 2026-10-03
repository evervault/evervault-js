import type { ExpiryLayoutError } from "shared/expiry";
import type { CardSpecNode, CardSpecNodeType, ExpiryHalf } from "types";

// What the card logs for the developer, shared with the tests that check it.

const COMPONENTS: Record<CardSpecNodeType, string> = {
  row: "Card.Row",
  name: "Card.Holder",
  number: "Card.Number",
  expiry: "Card.Expiry",
  expiryMonth: "Card.ExpiryMonth",
  expiryYear: "Card.ExpiryYear",
  cvc: "Card.Cvc",
  field: "Card.Field",
};

export function unreportableFieldName(name: string) {
  return `Card.Field "${name}" is never reported: a name cannot contain ".".`;
}

export function duplicateField(type: CardSpecNodeType) {
  return `<Card> ignored a duplicate ${COMPONENTS[type]}.`;
}

export const NAMELESS_CUSTOM_FIELD =
  "<Card> ignored a Card.Field without a name.";

export function duplicateCustomField(name: string) {
  return `<Card> ignored a second Card.Field named "${name}".`;
}

// Why a declared field was left out of the card.
export function skippedFieldWarning(node: CardSpecNode) {
  if (node.type !== "field") return duplicateField(node.type);

  return node.props.name
    ? duplicateCustomField(node.props.name)
    : NAMELESS_CUSTOM_FIELD;
}

export const COMBINED_EXPIRY_WITH_HALF = `<Card> declares ${COMPONENTS.expiry} alongside ${COMPONENTS.expiryMonth} or ${COMPONENTS.expiryYear}. Declare the combined field or the two halves, not both.`;

export function loneExpiryHalf(declared: ExpiryHalf) {
  const missing = declared === "expiryMonth" ? "expiryYear" : "expiryMonth";
  return `<Card> declares ${COMPONENTS[declared]} without ${COMPONENTS[missing]}. A split expiry needs both halves.`;
}

export function expiryLayoutMessage(error: ExpiryLayoutError) {
  if (error.kind === "combinedWithHalf") return COMBINED_EXPIRY_WITH_HALF;
  return loneExpiryHalf(error.declared);
}
