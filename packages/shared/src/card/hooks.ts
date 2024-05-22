import { CardBrandName } from "types";
import { MASKS } from "./masks";

export const cvcMask = (brand: CardBrandName) => {
  if (brand === "american-express") return MASKS.cards.cvc.native.americanExpress;
  return MASKS.cards.cvc.native.default;
}

