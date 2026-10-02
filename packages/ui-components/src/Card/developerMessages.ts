import type { ExpiryHalf } from "types";
import type { CardSpecNode } from "types";

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
