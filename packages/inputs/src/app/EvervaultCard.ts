import cardValidator from "card-validator";
import creditCardType, { types as CardType } from "credit-card-type";

const isAmexCard = (v: string): boolean =>
  creditCardType(v).some((value) => value.type === CardType.AMERICAN_EXPRESS);

export default class EvervaultCard {
  #disableCVV: boolean;
  #disableExpiry: boolean;

  cardNumber: string;
  cardExpiry: string | null;
  cardCVV: string | null;

  constructor(config: string[]) {
    this.#disableCVV = !config.includes("cardCVV");
    this.#disableExpiry = !config.includes("cardExpiry");

    this.cardNumber = "";
    this.cardExpiry = "";
    if (!this.#disableCVV) {
      this.cardCVV = "";
    } else {
      this.cardCVV = null;
    }

    if (this.#disableExpiry) {
      this.cardExpiry = null;
    }
  }

  get cardNumberVerification() {
    return cardValidator.number(this.cardNumber);
  }

  get cardExpiryVerification() {
    if (this.#disableExpiry) {
      return { isValid: true, isPotentiallyValid: true, month: "", year: "" };
    }
    const validator = cardValidator.expirationDate(this.cardExpiry);
    if (this.cardExpiry && this.cardExpiry.length >= 4 && !validator.isValid) {
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
    if (this.#disableExpiry) {
      return (
        this.cardNumberVerification.isValid && this.cardCVVVerification.isValid
      );
    }
    if (this.#disableExpiry && this.#disableCVV) {
      return this.cardNumberVerification.isValid;
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
    if (this.#disableExpiry) {
      return (
        this.cardNumberVerification.isValid && this.cardCVVVerification.isValid
      );
    }
    if (this.#disableExpiry && this.#disableCVV) {
      return this.cardNumberVerification.isValid;
    }
    return (
      this.cardNumberVerification.isPotentiallyValid &&
      this.cardExpiryVerification.isPotentiallyValid &&
      this.cardCVVVerification.isPotentiallyValid
    );
  }
}
