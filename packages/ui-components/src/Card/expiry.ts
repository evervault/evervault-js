import { expiryLayoutError } from "shared";
import { expiryLayoutMessage } from "./developerMessages";
import type { CardSpecNode } from "types";

export interface ExpiryHalves {
  month: string;
  year: string;
}

// Why the card cannot render a tree's expiry, or null when it can.
export function expiryError(nodes: CardSpecNode[]): string | null {
  const error = expiryLayoutError(nodes);
  return error && expiryLayoutMessage(error);
}

// The one expiry two halves hold. A year only means something behind a
// complete month, so until then the value is the month alone.
export function joinExpiry({ month, year }: ExpiryHalves): string {
  return month.length === 2 ? month + year : month;
}

export function splitExpiry(expiry: string): ExpiryHalves {
  return { month: expiry.slice(0, 2), year: expiry.slice(2, 4) };
}
