import { fieldTypes } from "shared/fieldTypes";
import {
  COMBINED_EXPIRY_WITH_HALF,
  EXPIRY_HALVES_APART,
  loneExpiryHalf,
} from "./developerMessages";
import type { CardSpecNode } from "types";

// Why a tree's expiry cannot be rendered, or null when it can: a half without
// the other is not a partial expiry, and the combined field excludes the halves.
export function expiryError(spec: CardSpecNode[]): string | null {
  const types = fieldTypes(spec);
  const combined = types.includes("expiry");
  const month = types.includes("expiryMonth");
  const year = types.includes("expiryYear");

  if (combined && (month || year)) {
    return COMBINED_EXPIRY_WITH_HALF;
  }

  if (month !== year) {
    return loneExpiryHalf(month ? "expiryMonth" : "expiryYear");
  }

  return null;
}

// Fields declared between the two halves are legal, but rarely meant.
export function expiryWarning(spec: CardSpecNode[]): string | null {
  const types = fieldTypes(spec);
  const month = types.indexOf("expiryMonth");
  const year = types.indexOf("expiryYear");

  if (month === -1 || year === -1 || Math.abs(month - year) === 1) return null;

  return EXPIRY_HALVES_APART;
}
