import { cardMessages, ELEMENT_NAMES } from "shared/developerMessages";
import type { CardSpecNode } from "types";

// What the card logs for the developer, shared with the tests that check it.
const messages = cardMessages(ELEMENT_NAMES);

export const {
  duplicateCustomField,
  namelessCustomField: NAMELESS_CUSTOM_FIELD,
  combinedExpiryWithHalf: COMBINED_EXPIRY_WITH_HALF,
  loneExpiryHalf,
  expiryLayoutMessage,
  unsupportedFieldType,
  invalidPattern,
} = messages;

// Kept in the wording the web card already logs, not the shared one.
export function duplicateField(type: CardSpecNode["type"]) {
  return `<ev-card> ignored a duplicate "${type}" field.`;
}

// Why a declared node was left out of the card.
export function skippedFieldWarning(node: CardSpecNode) {
  if (node.type !== "field") return duplicateField(node.type);
  return messages.skippedFieldWarning(node);
}
