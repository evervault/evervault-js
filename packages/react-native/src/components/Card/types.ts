import type { CardBrandName } from 'types';

export interface CardConfig {
  autoFocus?: boolean;
  acceptedBrands?: CardBrandName[];
}

export interface CardForm {
  name: string;
  number: string;
  cvc: string;
  expiry: string;
}

export { CardBrandName };
