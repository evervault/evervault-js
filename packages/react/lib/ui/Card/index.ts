import { Card as CardRoot } from "./Card";
import {
  CardCvc,
  CardExpiry,
  CardExpiryMonth,
  CardExpiryYear,
  CardField,
  CardHolder,
  CardNumber,
  CardRow,
} from "./fields";

export type { CardProps, CardRef } from "./Card";
export type {
  CardRowProps,
  CardNumberProps,
  CardExpiryProps,
  CardExpiryMonthProps,
  CardExpiryYearProps,
  CardCvcProps,
  CardHolderProps,
  CardFieldProps,
} from "./fields";

export const Card = Object.assign(CardRoot, {
  Row: CardRow,
  Holder: CardHolder,
  Number: CardNumber,
  Expiry: CardExpiry,
  ExpiryMonth: CardExpiryMonth,
  ExpiryYear: CardExpiryYear,
  Cvc: CardCvc,
  Field: CardField,
});
