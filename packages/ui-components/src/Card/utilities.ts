import {
  validateNumber,
  validateExpiry,
  validateCVC,
  CardNumberValidationResult,
} from "@evervault/card-validator";
import { UseFormReturn } from "shared";
import { ICONS } from "./icons";
import { MagStripeData } from "./useCardReader";
import type { CardForm } from "./types";
import type {
  CardBrandName,
  CardField,
  CardIcons,
  CardPayload,
  SwipedCard,
} from "types";
import Encryption from "@repo/encryption";

export async function changePayload(
  en: Encryption,
  form: UseFormReturn<CardForm>,
  fields: CardField[],
  opts?: {
    allow3DigitAmexCVC?: boolean;
  }
): Promise<CardPayload> {
  const { name, number, expiry, cvc } = form.values;
  const {
    brand,
    localBrands,
    bin,
    lastFour,
    isValid: isValidCardNumber,
  } = validateNumber(number);

  return {
    card: {
      name,
      brand,
      localBrands,
      bin,
      lastFour,
      number: isValidCardNumber ? await encryptedNumber(en, number) : null,
      expiry: formatExpiry(expiry),
      cvc: await encryptedCVC(en, cvc, number),
    },
    isValid: form.isValid,
    isComplete: isComplete(form, fields, opts),
    errors: Object.keys(form.errors ?? {}).length > 0 ? form.errors : null,
  };
}

function isComplete(
  form: UseFormReturn<CardForm>,
  fields: CardField[],
  opts?: {
    allow3DigitAmexCVC?: boolean;
  }
) {
  if (fields.includes("name")) {
    if (form.values.name.length === 0) return false;
  }

  if (fields.includes("number")) {
    const cardValidation = validateNumber(form.values.number);
    if (!cardValidation.isValid) return false;
  }

  if (fields.includes("expiry")) {
    const expiryValidation = validateExpiry(form.values.expiry);
    if (!expiryValidation.isValid) return false;
  }

  if (fields.includes("cvc")) {
    const cardValidation = validateNumber(form.values.number);
    const cvcValidation = validateCVC(form.values.cvc, form.values.number);
    if (!cvcValidation.isValid) return false;

    const allow3DigitAmex = opts?.allow3DigitAmexCVC ?? true;
    const isAmex = cardValidation.brand === "american-express";
    if (isAmex && form.values.cvc?.length === 3 && !allow3DigitAmex) {
      return false;
    }
  }

  return true;
}

export async function swipePayload(
  en: Encryption,
  values: MagStripeData
): Promise<SwipedCard> {
  const { brand, localBrands, bin, lastFour } = validateNumber(values.number);

  return {
    firstName: values.firstName ?? null,
    lastName: values.lastName ?? null,
    brand,
    localBrands,
    bin,
    lastFour,
    number: await encryptedNumber(en, values.number),
    expiry: {
      month: values.month,
      year: values.year,
    },
  };
}

export function isAcceptedBrand(
  acceptedBrands: CardBrandName[] | undefined,
  cardNumberValidationResult: CardNumberValidationResult
): boolean {
  if (!acceptedBrands) return true;
  const { brand, localBrands } = cardNumberValidationResult;

  const isBrandAccepted = brand !== null && acceptedBrands.includes(brand);
  const isLocalBrandAccepted = localBrands.some((localBrand) =>
    acceptedBrands.includes(localBrand)
  );

  return isBrandAccepted || isLocalBrandAccepted;
}

function formatExpiry(expiry: string) {
  const parsedExpiry = validateExpiry(expiry);

  return {
    month: parsedExpiry.month,
    year: parsedExpiry.year,
  };
}

async function encryptedNumber(en: Encryption, number: string) {
  return en.encrypt(number);
}

async function encryptedCVC(en: Encryption, cvc: string, cardNumber: string) {
  const { isValid } = validateCVC(cvc, cardNumber);

  if (!isValid) return null;
  return en.encrypt(cvc);
}

export function collectIcons(icons: boolean | CardIcons) {
  if (typeof icons === "boolean") return ICONS;
  return { ...ICONS, ...icons };
}
