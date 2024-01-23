import { PromisifiedEvervaultClient } from "@evervault/react";
import cardValidator from "card-validator";
import { UseFormReturn } from "../utilities/useForm";
import { MagStripeData } from "./useCardReader";
import type { CardForm } from "./types";
import type { CardField, CardPayload, SwipedCard } from "types";

export async function changePayload(
  ev: PromisifiedEvervaultClient,
  form: UseFormReturn<CardForm>,
  fields: CardField[]
): Promise<CardPayload> {
  const { name, number, expiry, cvc } = form.values;
  const brand = cardBrand(number);

  return {
    card: {
      name,
      brand,
      number: await encryptedNumber(ev, number),
      lastFour: lastFour(number),
      bin: binNumber(number, brand),
      expiry: formatExpiry(expiry),
      cvc: await encryptedCVC(ev, cvc, brand),
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
    const cardValidation = cardValidator.number(form.values.number);
    if (!cardValidation.isValid) return false;
  }

  if (fields.includes("expiry")) {
    const expiryValidation = cardValidator.expirationDate(form.values.expiry);
    if (!expiryValidation.isValid) return false;
  }

  if (fields.includes("cvc")) {
    const cardValidation = cardValidator.number(form.values.number);
    const validCVC = isCVCValid(form.values.cvc, cardValidation.card?.type);
    if (!validCVC) return false;
  }

  return true;
}

export async function swipePayload(
  ev: PromisifiedEvervaultClient,
  values: MagStripeData
): Promise<SwipedCard> {
  return {
    brand: cardBrand(values.number),
    number: await encryptedNumber(ev, values.number),
    expiry: {
      month: values.month,
      year: values.year,
    },
    firstName: values.firstName ?? null,
    lastName: values.lastName ?? null,
    lastFour: lastFour(values.number),
    bin: binNumber(values.number),
  };
}

function formatExpiry(expiry: string) {
  const parsedExpiry = cardValidator.expirationDate(expiry);

  return {
    month: parsedExpiry.month,
    year: parsedExpiry.year,
  };
}

function cardBrand(number: string) {
  const { card } = cardValidator.number(number);
  return card?.type;
}

function binNumber(card: string, brand?: string) {
  const { isValid } = cardValidator.number(card);
  if (!isValid) return null;
  if (brand === "amex") return card.substring(0, 6);
  return card.substring(0, 8);
}

function lastFour(card: string) {
  const { isValid } = cardValidator.number(card);
  if (!isValid) return null;
  return card.substring(card.length - 4);
}

async function encryptedNumber(ev: PromisifiedEvervaultClient, number: string) {
  const { isValid } = cardValidator.number(number);
  if (!isValid) return null;
  return ev.encrypt(number);
}

async function encryptedCVC(
  ev: PromisifiedEvervaultClient,
  cvc: string,
  brand?: string
) {
  if (!isCVCValid(cvc, brand)) return null;
  return ev.encrypt(cvc);
}

export function isCVCValid(cvc: string, brand?: string) {
  const { isValid } = cardValidator.cvv(
    cvc,
    brand === "american-express" ? 4 : 3
  );
  return isValid;
}
