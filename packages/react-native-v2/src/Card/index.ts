import { Card as CardRoot, type Card as CardRef } from "./Root";
import { CardHolder } from "./Holder";
import { CardExpiry } from "./Expiry";
import { CardCvc } from "./Cvc";
import { CardNumber } from "./Number";

export type { CardProps } from "./Root";
export type Card = CardRef;
export const Card = Object.assign(CardRoot, {
  Holder: CardHolder,
  Expiry: CardExpiry,
  Cvc: CardCvc,
  Number: CardNumber,
});

export type { CardHolderProps } from "./Holder";
export { CardHolder };

export type { CardExpiryProps } from "./Expiry";
export { CardExpiry };

export type { CardCvcProps } from "./Cvc";
export { CardCvc };

export type { CardNumberProps } from "./Number";
export { CardNumber };

export type { CardPayload, CardBrandName } from "./types";
