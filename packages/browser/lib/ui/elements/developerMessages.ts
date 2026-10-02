import { cardMessages, ELEMENT_NAMES } from "shared/developerMessages";
import { THEMES } from "./cardThemes";

// What <ev-card> logs for the developer, shared with the tests that check it.

export function unknownTheme(name: string) {
  return `<ev-card> has no "${name}" theme and will use "clean". Themes are: ${Object.keys(
    THEMES
  ).join(", ")}.`;
}

export const {
  combinedExpiryWithHalf: COMBINED_EXPIRY_WITH_HALF,
  loneExpiryHalf,
} = cardMessages(ELEMENT_NAMES);

export const EXPIRY_HALVES_APART = `<ev-card> declares fields between <${ELEMENT_NAMES.expiryMonth}> and <${ELEMENT_NAMES.expiryYear}>. The two halves are usually declared next to each other.`;
