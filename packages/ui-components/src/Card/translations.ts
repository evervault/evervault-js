import { CardTranslations } from "types";

export const DEFAULT_TRANSLATIONS: CardTranslations = {
  number: {
    label: "Card number",
    placeholder: "0000 0000 0000 0000",
    errors: {
      invalid: "Your card number is invalid",
    },
  },
  expiry: {
    label: "Expiration",
    placeholder: "MM/YY",
    errors: {
      invalid: "Your expiration date is invalid",
    },
  },
  cvc: {
    label: "CVC",
    placeholder: "CVC",
    errors: {
      invalid: "Your CVC is invalid",
    },
  },
};
