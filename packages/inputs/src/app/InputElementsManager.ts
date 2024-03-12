import cardValidator from "card-validator";
import IMask, { InputMask, MaskedDynamic } from "imask";

interface InputElements {
  cardNumber: HTMLInputElement;
  expirationDate: HTMLInputElement;
  cvv?: HTMLInputElement;
  name: HTMLInputElement;
  trackData: HTMLInputElement;
  trackOne: HTMLInputElement;
  trackTwo: HTMLInputElement;
}

interface CardMask {
  mask: string;
  brand?: string;
}

interface InputMasks {
  cardNumber: InputMask<{ mask: CardMask[] }>;
  expirationDate: InputMask<{ mask: string }>;
  cvv?: InputMask<{ mask: string }>;
}

type ElementId =
  | "cardnumber"
  | "expirationdate"
  | "securitycode"
  | "name"
  | "trackdata"
  | "trackone"
  | "tracktwo";

function createGetInputElementOrThow(key: ElementId): HTMLInputElement {
  const nameElement = document.getElementById(key);
  if (nameElement instanceof HTMLInputElement) {
    return nameElement;
  }
  throw new TypeError(`Element with id ${key} is not an input element`);
}

/**
 * Provides type safety and a single place to manage the input elements.
 * If the elements are managed by masks, the masks are also managed here.
 */
export class InputElementsManager {
  elements: InputElements;
  masks: InputMasks;

  constructor(
    postToParent: (message: unknown) => void,
    { disableCVV = false, reveal = false }
  ) {
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
        mask: [
          {
            mask: "0000 0000 0000 0000",
          },
          {
            mask: "0000 0000 0000 0000 000",
            brand: "unionpay",
          },
          {
            mask: "0000 000000 00000",
            brand: "american-express",
          },
        ] as CardMask[],
        dispatch: (appended: string, dynamicMasked: MaskedDynamic) => {
          const number = dynamicMasked.value + appended;
          const brand = cardValidator.number(number).card?.type;

          const mask = dynamicMasked.compiledMasks.find((m) => {
            const maskBrand = (m as CardMask).brand;
            return maskBrand === brand;
          });

          return mask ?? dynamicMasked.compiledMasks[0];
        },
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

    // if reveal disable all the fields
    if (reveal) {
      this.elements.cardNumber.disabled = true;
      this.elements.expirationDate.disabled = true;
      this.elements.name.disabled = true;
      this.elements.trackData.disabled = true;
      this.elements.trackOne.disabled = true;
      this.elements.trackTwo.disabled = true;
      if (this.elements.cvv) {
        this.elements.cvv.disabled = true;
      }
    }
  }
}
