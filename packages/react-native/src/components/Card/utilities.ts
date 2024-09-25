import {
  validateNumber,
  validateExpiry,
  validateCVC,
  CardNumberValidationResult,
} from "@evervault/card-validator";
import type { CardForm, CardBrandName, CardField, CardPayload } from "./types";
import { UseFormReturn } from "../useForm";

export async function changePayload(
  encrypt: (value: string) => Promise<string>,
  form: UseFormReturn<CardForm>,
  fields: CardField[]
): Promise<CardPayload> {
  const { name, number: rawNumber, expiry, cvc } = form.values;

  const number = fields.includes("number") ? rawNumber.replace(/\s/g, "") : "";

  const {
    brand,
    localBrands,
    bin,
    lastFour,
    isValid: isValidCardNumber,
  } = validateNumber(number);

  if (number.length > 0 && brand !== "american-express" && cvc?.length === 4) {
    form.setValues((prev) => ({
      ...prev,
      cvc: cvc.slice(0, 3),
    }));
  }

  return {
    card: {
      name,
      brand,
      localBrands,
      bin,
      lastFour,
      number: isValidCardNumber ? await encryptedNumber(encrypt, number) : null,
      expiry: formatExpiry(expiry),
      cvc: await encryptedCVC(encrypt, cvc, number),
    },
    isValid: form.isValid,
    isComplete: isComplete(form, fields),
    errors: Object.keys(form.errors ?? {}).length > 0 ? form.errors : null,
  };
}

export function isComplete(form: UseFormReturn<CardForm>, fields: CardField[]) {
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
    const cvcValidation = validateCVC(form.values.cvc, form.values.number);
    if (!cvcValidation.isValid) return false;
  }

  return true;
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

async function encryptedNumber(
  encrypt: (value: string) => Promise<string>,
  number: string
) {
  return encrypt(number);
}

async function encryptedCVC(
  encrypt: (value: string) => Promise<string>,
  cvc: string,
  cardNumber: string
) {
  const { isValid } = validateCVC(cvc, cardNumber);

  if (!isValid) return null;
  return encrypt(cvc);
}
