import IMask from "imask";

type InputElements = {
  cardNumber: HTMLInputElement;
  expirationDate: HTMLInputElement;
  cvv?: HTMLInputElement;
  name: HTMLInputElement;
  trackData: HTMLInputElement;
  trackOne: HTMLInputElement;
  trackTwo: HTMLInputElement;
};

type InputMasks = {
  cardNumber: IMask.InputMask<{ mask: string }>;
  expirationDate: IMask.InputMask<{ mask: string }>;
  cvv?: IMask.InputMask<{ mask: string }>;
};

type ElementId =
  "cardnumber" |
  "expirationdate" |
  "securitycode" |
  "name" |
  "trackdata" |
  "trackone" |
  "tracktwo";

const createGetInputElementOrThow = (key: ElementId) => {
  const nameElement = document.getElementById(key);
  if (nameElement instanceof HTMLInputElement) {
    return nameElement;
  } else {
    throw new TypeError(`Element with id ${key} is not an input element`);
  }
};

/**
 * Provides type safety and a single place to manage the input elements.
 * If the elements are managed by masks, the masks are also managed here.
 */
export class InputElementsManager {
  elements: InputElements;
  masks: InputMasks;

  constructor(postToParent: (message: any) => void, { disableCVV = false }) {
    this.elements = {
      cardNumber: createGetInputElementOrThow("cardnumber"),
      expirationDate: createGetInputElementOrThow("expirationdate"),
      name: createGetInputElementOrThow("name"),
      trackData: createGetInputElementOrThow("trackdata"),
      trackOne: createGetInputElementOrThow("trackone"),
      trackTwo: createGetInputElementOrThow("tracktwo"),
    };


    this.masks = {
      cardNumber: IMask(this.elements.cardNumber, {
        mask: "0000 0000 0000 0000",
      }),
      expirationDate: IMask(this.elements.expirationDate, {
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
      }),
    };

    this.elements.cardNumber.addEventListener("input", postToParent);
    this.elements.expirationDate.addEventListener("input", postToParent);

    if (!disableCVV) {
      this.elements.cvv = createGetInputElementOrThow("securitycode");
      this.masks.cvv = IMask(this.elements.cvv, {
        mask: "000[0]",
      });
      this.elements.cvv.addEventListener("input", postToParent);
    }
  }
}
