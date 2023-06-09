import cardValidator from "card-validator";
import creditCardType, { types as CardType } from "credit-card-type";

const isAmexCard = (value: string) =>
  creditCardType(value).some(
    (value) => value.type === CardType["AMERICAN_EXPRESS"]
  );

export default class EvervaultCard {
  #disableCVV: boolean;

  cardNumber: string;
  cardExpiry: string;
  cardCVV: string | null;

  constructor(config: string[]) {
    this.#disableCVV = !config.includes("cardCVV");

    this.cardNumber = "";
    this.cardExpiry = "";
    if (!this.#disableCVV) {
      this.cardCVV = "";
    } else {
      this.cardCVV = null;
    }
  }

  get cardNumberVerification() {
    return cardValidator.number(this.cardNumber);
  }

  get cardExpiryVerification() {
    const validator = cardValidator.expirationDate(this.cardExpiry);
    if (this.cardExpiry.length >= 4 && !validator.isValid) {
      validator.isPotentiallyValid = false;
    }
    return validator;
  }

  get cardCVVVerification() {
    if (this.#disableCVV) {
      return { isValid: true, isPotentiallyValid: true };
    }
    const cvvLength = isAmexCard(this.cardNumber) ? 4 : 3;
    const validator = cardValidator.cvv(this.cardCVV, cvvLength);
    return validator;
  }

  generateError = (errorLabels: {
    invalidCardNumberLabel: string;
    invalidExpirationDateLabel: string;
    invalidSecurityCodeLabel: string;
  }) => {
    const error = [];
    if (!this.cardNumberVerification.isPotentiallyValid) {
      error.push({
        type: "invalid_pan",
        message: errorLabels.invalidCardNumberLabel,
      });
    }
    if (!this.cardExpiryVerification.isPotentiallyValid) {
      error.push({
        type: "invalid_expiry",
        message: errorLabels.invalidExpirationDateLabel,
      });
    }
    if (!this.cardCVVVerification.isPotentiallyValid && !this.#disableCVV) {
      error.push({
        type: "invalid_cvv",
        message: errorLabels.invalidSecurityCodeLabel,
      });
    }
    return error;
  };

  isCardValid() {
    if (this.#disableCVV) {
      return (
        this.cardNumberVerification.isValid &&
        this.cardExpiryVerification.isValid
      );
    }
    return (
      this.cardNumberVerification.isValid &&
      this.cardExpiryVerification.isValid &&
      this.cardCVVVerification.isValid
    );
  }

  isPotentiallyValid() {
    if (this.#disableCVV) {
      return (
        this.cardNumberVerification.isPotentiallyValid &&
        this.cardExpiryVerification.isPotentiallyValid
      );
    }
    return (
      this.cardNumberVerification.isPotentiallyValid &&
      this.cardExpiryVerification.isPotentiallyValid &&
      this.cardCVVVerification.isPotentiallyValid
    );
  }
}
