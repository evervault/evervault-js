import { CardBrandName } from "card-validator/types";
import type { ThemeObject, CardField, CardTranslations } from "types";

export interface CardConfig {
  theme?: ThemeObject;
  autoFocus?: boolean;
  hiddenFields?: ("number" | "expiry" | "cvc")[];
  fields?: CardField[];
  acceptedBrands?: CardBrandName[];
  translations?: Partial<CardTranslations>;
}

export interface CardForm {
  name: string;
  number: string;
  cvc: string;
  expiry: string;
}
