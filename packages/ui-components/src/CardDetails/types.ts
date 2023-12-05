import type {
  ThemeObject,
  CardDetailsField,
  CardDetailsTranslations,
} from "types";

export interface CardDetailsConfig {
  theme?: ThemeObject;
  autoFocus?: boolean;
  hiddenFields?: CardDetailsField[];
  translations?: Partial<CardDetailsTranslations>;
}

export interface CardDetailsForm {
  number: string;
  cvc: string;
  expiry: string;
}
