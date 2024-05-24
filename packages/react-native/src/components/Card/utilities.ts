import {
  validateNumber,
  validateExpiry,
  validateCVC,
  CardNumberValidationResult,
} from '@evervault/card-validator';
import type { CardForm } from './types';
import type { CardBrandName, CardField, CardPayload } from 'types';
import { UseFormReturn } from 'shared';

export async function changePayload(
  encrypt: (value: string) => Promise<string>,
  form: UseFormReturn<CardForm>,
  fields: CardField[]
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
  if (fields.includes('name')) {
    if (form.values.name.length === 0) return false;
  }

  if (fields.includes('number')) {
    const cardValidation = validateNumber(form.values.number);
    if (!cardValidation.isValid) return false;
  }

  if (fields.includes('expiry')) {
    const expiryValidation = validateExpiry(form.values.expiry.replace(" / ", ""));
    if (!expiryValidation.isValid) return false;
  }

  if (fields.includes('cvc')) {
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
  const parsedExpiry = validateExpiry(expiry.replace(" / ", ""));

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
