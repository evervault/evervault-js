export type { CardFrameConfig as CardConfig } from "types";
import type { CardField } from "types";

export interface CardForm {
  name: string;
  number: string;
  cvc: string;
  expiry: string;
}

// The inputs a card can render: the fields, and the two halves of a split
// expiry, which write the one expiry between them.
export type CardInput = CardField | "expiry-month" | "expiry-year";
