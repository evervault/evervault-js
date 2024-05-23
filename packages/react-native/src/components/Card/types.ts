import type { CardTranslations, CardBrandName } from 'types';

export interface CardConfig {
  autoFocus?: boolean;
  acceptedBrands?: CardBrandName[];
  translations?: Partial<CardTranslations>;
}

export interface CardForm {
  name: string;
  number: string;
  cvc: string;
  expiry: string;
}
