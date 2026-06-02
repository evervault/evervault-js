import {
  validateNumber,
  validateExpiry,
  validateCVC,
  CardNumberValidationResult,
} from "@evervault/card-validator";
import { PromisifiedEvervaultClient } from "@evervault/react";
import { UseFormReturn } from "shared";
import { ICONS } from "./icons";
import { MagStripeData } from "./useCardReader";
import type { CardForm } from "./types";
import type {
  CustomBrand,
  CardBrandName,
  CardField,
  CardIcons,
  CardPayload,
  SwipedCard,
} from "types";
import { CARD_BRAND_NAMES } from "types";

export async function changePayload(
  ev: PromisifiedEvervaultClient,
  form: UseFormReturn<CardForm>,
  fields: CardField[],
  opts?: {
    allow3DigitAmexCVC?: boolean;
    cvcOptional?: boolean;
    customBrands?: CustomBrand[];
  }
): Promise<CardPayload> {
  const { name, number, expiry, cvc } = form.values;
  const {
    brand,
    localBrands,
    bin,
    lastFour,
    isValid: isValidCardNumber,
  } = validateNumber(number, { customBrands: opts?.customBrands });

  return {
    card: {
      name,
      brand,
      localBrands,
      bin,
      lastFour,
      number: isValidCardNumber ? await encryptedNumber(ev, number) : null,
      expiry: formatExpiry(expiry),
      cvc: await encryptedCVC(ev, cvc, number, {
        customBrands: opts?.customBrands,
      }),
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
    cvcOptional?: boolean;
    customBrands?: CustomBrand[];
  }
) {
  if (fields.includes("name")) {
    if (form.values.name.length === 0) return false;
  }

  if (fields.includes("number")) {
    const cardValidation = validateNumber(form.values.number, {
      customBrands: opts?.customBrands,
    });
    if (!cardValidation.isValid) return false;
  }

  if (fields.includes("expiry")) {
    const expiryValidation = validateExpiry(form.values.expiry);
    if (!expiryValidation.isValid) return false;
  }

  if (
    fields.includes("cvc") &&
    !(opts?.cvcOptional && form.values.cvc.length === 0)
  ) {
    const cardValidation = validateNumber(form.values.number, {
      customBrands: opts?.customBrands,
    });
    const cvcValidation = validateCVC(form.values.cvc, form.values.number, {
      customBrands: opts?.customBrands,
    });
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

function isDefaultCardBrand(brand: string): brand is CardBrandName {
  return (CARD_BRAND_NAMES as string[]).includes(brand);
}

export function isBrandSupported(
  cardNumberValidationResult: CardNumberValidationResult,
  opts?: {
    acceptedBrands?: CardBrandName[];
    customBrands?: CustomBrand[];
  }
): boolean {
  const { acceptedBrands, customBrands } = opts ?? {};
  if (!acceptedBrands) return true;

  const { brand, localBrands } = cardNumberValidationResult;
  const customBrandNames = customBrands?.map((b) => b.name) ?? [];

  const isBrandAccepted = brand !== null && acceptedBrands.includes(brand);

  const isLocalBrandAccepted = localBrands.some((localBrand) => {
    if (isDefaultCardBrand(localBrand)) {
      return acceptedBrands.includes(localBrand);
    }
    return customBrandNames.includes(localBrand);
  });

  return isBrandAccepted || isLocalBrandAccepted;
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
  cardNumber: string,
  opts?: {
    customBrands?: CustomBrand[];
  }
) {
  const { isValid } = validateCVC(cvc, cardNumber, opts);

  if (!isValid) return null;
  return ev.encrypt(cvc);
}

export function collectIcons(icons: boolean | CardIcons) {
  if (typeof icons === "boolean") return ICONS;
  return { ...ICONS, ...icons };
}
