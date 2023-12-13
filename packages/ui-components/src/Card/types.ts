import type { ThemeObject, CardField, CardTranslations } from "types";

export interface CardConfig {
  theme?: ThemeObject;
  autoFocus?: boolean;
  hiddenFields?: CardField[];
  translations?: Partial<CardTranslations>;
}

export interface CardForm {
  number: string;
  cvc: string;
  expiry: string;
}
