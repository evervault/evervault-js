import type {
  ThemeObject,
  CardField,
  CardTranslations,
  CardBrandName,
  CardIcons,
} from "types";

export interface CardConfig {
  icons?: boolean | CardIcons;
  theme?: ThemeObject;
  autoFocus?: boolean;
  hiddenFields?: ("number" | "expiry" | "cvc")[];
  fields?: CardField[];
  acceptedBrands?: CardBrandName[];
  translations?: Partial<CardTranslations>;
  autoProgress?: boolean;
  defaultValues?: {
    name?: string;
  };
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
