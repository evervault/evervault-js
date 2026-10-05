import { cardMessages, COMPONENT_NAMES } from "shared/developerMessages";

// What the card logs for the developer, shared with the tests that check it.
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
