import { validateNumber } from "@evervault/card-validator";

type MaskType = "native" | "imask";

export const MASK_TYPE = {
  NATIVE: "native",
  IMASK: "imask",
} as const;

export const MASKS = {
  native: {
    cvc: {
      "american-express": "9999",
      default: "999",
    },
    expiry: "99 / 99",
    number: {
      default: "9999 9999 9999 9999",
      unionpay: "9999 9999 9999 9999 999",
      "american-express": "9999 999999 99999",
    },
  },
};

export const cvcMask = (cardNumber: string, maskType: MaskType) => {
  const type = validateNumber(cardNumber).brand;
  if (type === "american-express") return MASKS.native.cvc["american-express"];
  return MASKS.native.cvc.default;
};
