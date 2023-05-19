import IMask from "imask";

export class InputElementsManager {
  els;
  masks;

  constructor(postToParent, { disableCVV }) {
    this.els = {};
    this.masks = {};

    this.els.cardNumber = document.getElementById("cardnumber");
    this.els.expirationDate = document.getElementById("expirationdate");

    this.masks.cardNumber = IMask(this.els.cardNumber, {
      mask: "0000 0000 0000 0000",
    });
    this.masks.expirationDate = IMask(this.els.expirationDate, {
      mask: "MM / YY",
      blocks: {
        MM: {
          mask: IMask.MaskedRange,
          placeholderChar: "MM",
          from: 1,
          to: 12,
          maxLength: 2,
        },
        YY: {
          mask: IMask.MaskedRange,
          placeholderChar: "YY",
          from: 0,
          to: 99,
          maxLength: 2,
        },
      },
    });

    this.els.cardNumber.addEventListener("input", postToParent);
    this.els.expirationDate.addEventListener("input", postToParent);

    if (!disableCVV) {
      this.els.cvc = document.getElementById("securitycode");
      this.masks.cvc = IMask(this.els.cvc, { mask: "000[0]" });
      this.els.cvc.addEventListener("input", postToParent);
    }
  }
}
