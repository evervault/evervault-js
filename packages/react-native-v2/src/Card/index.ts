import { CardHolder } from "./Holder";
import { Card as CardRoot } from "./Root";

export type { CardProps } from "./Root";
export const Card = Object.assign(CardRoot, {
  Holder: CardHolder,
});

export type { CardHolderProps } from "./Holder";
export { CardHolder };
