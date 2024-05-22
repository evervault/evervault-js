import { validateNumber } from "@evervault/card-validator";

type MaskType = "native" | "imask";

export const MASK_TYPE = {
  NATIVE: "native",
  IMASK: "imask",
} as const;

export const MASKS = {
  native: {
    cvc: {
      americanExpress: ["/d", "/d", "/d", "/d"],
      default: ["/d", "/d", "/d"],
    }
  },
  imask: {
    cvc: {
      americanExpress: {
        mask: "0000",
      },
      default: {
        mask: "000",
      },
    },
  }
}

export const cvcMask = (cardNumber: string, maskType: MaskType) => {
  const type = validateNumber(cardNumber).brand;
  if (type === "american-express") return MASKS.native.cvc.americanExpress;
  return MASKS.native.cvc.default;
}
