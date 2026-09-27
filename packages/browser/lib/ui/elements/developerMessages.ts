import { THEMES } from "./cardThemes";

type ExpiryHalf = "expiryMonth" | "expiryYear";

const HALF_TAGS: Record<ExpiryHalf, string> = {
  expiryMonth: "<ev-card-expiry-month>",
  expiryYear: "<ev-card-expiry-year>",
};

// What <ev-card> logs for the developer, shared with the tests that check it.

export function unknownTheme(name: string) {
  return `<ev-card> has no "${name}" theme and will use "clean". Themes are: ${Object.keys(
    THEMES
  ).join(", ")}.`;
}

export const COMBINED_EXPIRY_WITH_HALF = `<ev-card> declares <ev-card-expiry> alongside ${HALF_TAGS.expiryMonth} or ${HALF_TAGS.expiryYear}. Declare the combined field or the two halves, not both.`;

export function loneExpiryHalf(declared: ExpiryHalf) {
  const missing = declared === "expiryMonth" ? "expiryYear" : "expiryMonth";
  return `<ev-card> declares ${HALF_TAGS[declared]} without ${HALF_TAGS[missing]}. A split expiry needs both halves.`;
}

export const EXPIRY_HALVES_APART = `<ev-card> declares fields between ${HALF_TAGS.expiryMonth} and ${HALF_TAGS.expiryYear}. The two halves are usually declared next to each other.`;
