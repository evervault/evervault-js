import { CardTranslations } from 'types';

export const DEFAULT_TRANSLATIONS: CardTranslations = {
  name: {
    label: 'Card Holder',
    placeholder: 'Name',
    errors: {
      invalid: 'Please enter your full name',
    },
  },
  number: {
    label: 'Card Number',
    placeholder: '0000 0000 0000 0000',
    errors: {
      invalid: 'Your card number is invalid',
      unsupportedBrand: 'This card brand is not supported',
    },
  },
  expiry: {
    label: 'Expiration',
    placeholder: 'MM/YY',
    errors: {
      invalid: 'Your expiration date is invalid',
    },
  },
  cvc: {
    label: 'CVC',
    placeholder: 'CVC',
    errors: {
      invalid: 'Your CVC is invalid',
    },
  },
};
