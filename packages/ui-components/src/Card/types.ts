import type {
  ThemeObject,
  CardField,
  CardTranslations,
  CardBrandName,
} from "types";

export interface CardConfig {
  theme?: ThemeObject;
  autoFocus?: boolean;
  hiddenFields?: ("number" | "expiry" | "cvc")[];
  fields?: CardField[];
  acceptedBrands?: CardBrandName[];
  translations?: Partial<CardTranslations>;
  autoProgress?: boolean;
  autoComplete?: {
    name?: boolean;
    number?: boolean;
    expiry?: boolean;
    cvc?: boolean;
  };
}

export interface CardForm {
  name: string;
  number: string;
  cvc: string;
  expiry: string;
}
