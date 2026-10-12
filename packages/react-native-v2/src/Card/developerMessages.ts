import { cardMessages, COMPONENT_NAMES } from "shared/developerMessages";
import type { CardSpecNodeType } from "types/cardSpec";

export const {
  duplicateField,
  duplicateCustomField,
  namelessCustomField: NAMELESS_CUSTOM_FIELD,
  combinedExpiryWithHalf: COMBINED_EXPIRY_WITH_HALF,
  loneExpiryHalf,
  expiryLayoutMessage,
  skippedFieldWarning,
  unsupportedFieldType,
  invalidPattern,
  customFieldWarnings,
} = cardMessages(COMPONENT_NAMES);

export function fieldOutsideCard(type: CardSpecNodeType) {
  return `${COMPONENT_NAMES[type]} must be rendered inside <${COMPONENT_NAMES.card}>.`;
}
