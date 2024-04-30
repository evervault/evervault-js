import { PromisifiedEvervaultClient } from "@evervault/react";
import { validateNumber, validateExpiry, validateCVC } from "card-validator";
import { UseFormReturn } from "../utilities/useForm";
import { MagStripeData } from "./useCardReader";
import type { CardForm } from "./types";
import type { CardField, CardPayload, SwipedCard } from "types";
import { CardBrandName, CardNumberValidationResult } from "card-validator/types";

export async function changePayload(
  ev: PromisifiedEvervaultClient,
  form: UseFormReturn<CardForm>,
  fields: CardField[]
): Promise<CardPayload> {
  const { name, number, expiry, cvc } = form.values;
  const { brand, localBrands, bin, lastFour, isValid: isValidCardNumber } = validateNumber(number);

  return {
    card: {
      name,
      brand,
      localBrands,
      bin,
      lastFour,
      number: isValidCardNumber ? await encryptedNumber(ev, number) : null,
      expiry: formatExpiry(expiry),
      cvc: await encryptedCVC(ev, cvc, number),
    },
    isValid: form.isValid,
    isComplete: isComplete(form, fields),
    errors: Object.keys(form.errors ?? {}).length > 0 ? form.errors : null,
  };
}

function isComplete(form: UseFormReturn<CardForm>, fields: CardField[]) {
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
    if (!cvcValidation) return false;
  }

  return true;
}

export async function swipePayload(
  ev: PromisifiedEvervaultClient,
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
    number: await encryptedNumber(ev, values.number),
    expiry: {
      month: values.month,
      year: values.year,
    },
  };
}

export function isAcceptedBrand(
  acceptedBrands: CardBrandName[] | undefined,
  cardNumberValidationResult: CardNumberValidationResult,
) {
  if (!acceptedBrands) return true;
  const { brand, localBrands } = cardNumberValidationResult;

  return (brand && acceptedBrands.includes(brand)) || localBrands.some((localBrand) => acceptedBrands.includes(localBrand));
}

function formatExpiry(expiry: string) {
  const parsedExpiry = validateExpiry(expiry);

  return {
    month: parsedExpiry.month,
    year: parsedExpiry.year,
  };
}

async function encryptedNumber(ev: PromisifiedEvervaultClient, number: string) {
  return ev.encrypt(number);
}

async function encryptedCVC(
  ev: PromisifiedEvervaultClient,
  cvc: string,
  cardNumber: string
) {
  const { isValid } = validateCVC(cvc, cardNumber);
  if (!isValid) return null;
  return ev.encrypt(cvc);
}