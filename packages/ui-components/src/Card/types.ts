export type { CardFrameConfig as CardConfig } from "types";
import type { CardField } from "types";

export interface CardForm {
  name: string;
  number: string;
  cvc: string;
  expiry: string;
}

export type CustomFieldInputId = `field-${string}`;

// The inputs a card can render: the fields, the two halves of a split expiry,
// which write the one expiry between them, and the customer's own fields.
export type CardInput =
  | CardField
  | "expiry-month"
  | "expiry-year"
  | CustomFieldInputId;
