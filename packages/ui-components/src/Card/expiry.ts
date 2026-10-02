import { expiryLayoutError } from "shared";
import { fieldTypes } from "shared/fieldTypes";
import { COMBINED_EXPIRY_WITH_HALF, loneExpiryHalf } from "./developerMessages";
import type { CardSpecNode, ExpiryHalf } from "types";

export interface ExpiryParts {
  month: string;
  year: string;
}

// The combined field, or the two halves with the one the shared error renders
// under: whichever appears later in declared order.
export type DeclaredExpiry =
  | { form: "combined" }
  | { form: "split"; later: ExpiryHalf }
  | null;

// Why the card cannot render a tree's expiry, or null when it can.
export function expiryError(nodes: CardSpecNode[]): string | null {
  const error = expiryLayoutError(nodes);

  if (!error) return null;
  if (error.kind === "combinedWithHalf") return COMBINED_EXPIRY_WITH_HALF;
  return loneExpiryHalf(error.declared);
}

// The expiry of a tree `expiryError` accepts.
export function declaredExpiry(nodes: CardSpecNode[]): DeclaredExpiry {
  const types = fieldTypes(nodes);
  const month = types.indexOf("expiryMonth");
  const year = types.indexOf("expiryYear");

  if (types.includes("expiry")) return { form: "combined" };
  if (month === -1) return null;

  return { form: "split", later: month > year ? "expiryMonth" : "expiryYear" };
}

// The one expiry two halves hold. A year only means something behind a
// complete month, so until then the value is the month alone.
export function joinExpiry({ month, year }: ExpiryParts): string {
  return month.length === 2 ? month + year : month;
}

export function splitExpiry(expiry: string): ExpiryParts {
  return { month: expiry.slice(0, 2), year: expiry.slice(2, 4) };
}
