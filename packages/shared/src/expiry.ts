import { fieldTypes } from "./fieldTypes";
import type { CardSpecNode, ExpiryHalf } from "types";

// Why a card cannot render a tree's expiry: a half without the other is not a
// partial expiry, and the combined field leaves no room for the halves.
export type ExpiryLayoutError =
  | { kind: "combinedWithHalf" }
  | { kind: "loneHalf"; declared: ExpiryHalf };

export function expiryLayoutError(
  nodes: CardSpecNode[]
): ExpiryLayoutError | null {
  const types = fieldTypes(nodes);
  const combined = types.includes("expiry");
  const month = types.includes("expiryMonth");
  const year = types.includes("expiryYear");

  if (combined && (month || year)) {
    return { kind: "combinedWithHalf" };
  }

  if (month !== year) {
    return { kind: "loneHalf", declared: month ? "expiryMonth" : "expiryYear" };
  }

  return null;
}
