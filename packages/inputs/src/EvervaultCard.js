import cardValidator from 'card-validator';
import creditCardType, { types as CardType } from 'credit-card-type';

const isAmexCard = (value) => creditCardType(value).find(function(card) {
  return card.type === CardType.AMERICAN_EXPRESS;
})

export default class EvervaultCard {
  constructor(config) {
    this.config = config;
    this.disableCVV = !config.includes('cardCVV');
  }

  set cardNumber(value) {
    const validator = cardValidator.number(value);
    this._cardNumber = {...validator, inputValue: value} 
  }

  get cardNumber() {
    return this._cardNumber;
  }

  set cardExpiry(value) {
    const validator = cardValidator.expirationDate(value);
    if (value.length >= 7 && !validator.isValid) {
      validator.isPotentiallyValid = false;
    }
    this._cardExpiry = {...validator, inputValue: value};
  }

  get cardExpiry() {
    return this._cardExpiry;
  }

  set cardCVV(value) {
    const cvcLength = isAmexCard(this._cardNumber.inputValue) ? 4 : 3;
    const validator = cardValidator.cvv(value, cvcLength);
    this._cardCVV = {...validator, inputValue: value}
  }

  get cardCVV() {
    return this._cardCVV;
  }

  generateError = (errorLabels) => {
    const error = [];
    if (!this.cardNumber.isPotentiallyValid) {
      error.push({
        type: 'invalid_pan',
        message: errorLabels.invalidCardNumberLabel,
      });
    }
    if (!this.cardExpiry.isPotentiallyValid) {
      error.push({
        type: 'invalid_expiry',
        message: errorLabels.invalidExpirationDateLabel,
      });
    }
    if (!this.cardCVV.isPotentiallyValid && !this.disableCVV) {
      error.push({
        type: 'invalid_cvc',
        message: errorLabels.invalidSecurityCodeLabel,
      });
    }
    return error;
  }

  isCardValid() {
    if (this.disableCVV) {
      return this.cardNumber.isValid && this.cardExpiry.isValid
    }
    return this.cardNumber.isValid && this.cardExpiry.isValid && this.cardCVV.isValid;
  }

  isPotentiallyValid() {
    if (this.disableCVV) {
      return this.cardNumber.isPotentiallyValid && this.cardExpiry.isPotentiallyValid
    }
    return this.cardNumber.isPotentiallyValid && this.cardExpiry.isPotentiallyValid && this.cardCVV.isPotentiallyValid;
  }
}