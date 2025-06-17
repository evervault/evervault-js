import {
  validateNumber,
  validateExpiry,
  validateCVC,
  CardNumberValidationResult,
} from "@evervault/card-validator";
import type { CardBrandName, CardPayload } from "./types";
import { getCardSchema, type CardFormValues } from "./schema";
import { DeepPartial, UseFormReturn } from "react-hook-form";
import { type Encrypted, sdk } from "../sdk";
import { z } from "zod";

function getError(error: z.ZodError | undefined, path: string[]) {
  if (!error) return undefined;
  return error.issues.find((issue) => issue.path.join(".") === path.join("."));
}

function hasError(error: z.ZodError | undefined, path: string[]) {
  return !!getError(error, path);
}

export interface FormatPayloadContext {
  schema: z.ZodObject<{ card: ReturnType<typeof getCardSchema> }>;
  form: UseFormReturn<{ card: CardFormValues }>;
  encrypt<T>(data: T): Promise<Encrypted<T>>;
}

export async function formatPayload(
  { card }: DeepPartial<{ card: CardFormValues }>,
  context: FormatPayloadContext
): Promise<CardPayload> {
  const values = card ?? {};
  const parsed = context.schema.safeParse({ card: values });

  const formErrors = context.form.formState.errors.card ?? {};
  const isValid = !Object.keys(formErrors).length;
  const isComplete = areValuesComplete(values, context.schema);

  const payload: CardPayload = {
    card: {
      name: null,
      brand: null,
      localBrands: [],
      number: null,
      lastFour: null,
      bin: null,
      expiry: null,
      cvc: null,
    },
    isValid,
    isComplete,
    errors: {},
  };

  if (formErrors.name?.message) {
    payload.errors.name = formErrors.name.message;
  } else if (values.name && !hasError(parsed.error, ["card", "name"])) {
    payload.card.name = values.name;
  }

  if (formErrors.number?.message) {
    payload.errors.number = formErrors.number.message;
  } else if (values.number && !hasError(parsed.error, ["card", "number"])) {
    const number = formatNumber(values.number);
    const result = validateNumber(number);
    payload.card.brand = result.brand;
    payload.card.localBrands = result.localBrands;
    payload.card.bin = result.bin;
    payload.card.lastFour = result.lastFour;
    payload.card.number = await context.encrypt(number);
  }

  if (formErrors.expiry?.message) {
    payload.errors.expiry = formErrors.expiry.message;
  } else if (values.expiry && !hasError(parsed.error, ["card", "expiry"])) {
    payload.card.expiry = formatExpiry(values.expiry);
  }

  if (formErrors.cvc?.message) {
    payload.errors.cvc = formErrors.cvc.message;
  } else if (values.cvc && !hasError(parsed.error, ["card", "cvc"])) {
    payload.card.cvc = await context.encrypt(values.cvc);
  }

  return payload;
}

export function areValuesComplete(
  values: DeepPartial<CardFormValues>,
  schema: z.ZodObject<{ card: ReturnType<typeof getCardSchema> }>
) {
  const parsed = schema.safeParse({ card: values });

  if ("name" in values && hasError(parsed.error, ["card", "name"])) {
    return false;
  }

  if ("number" in values && hasError(parsed.error, ["card", "number"])) {
    return false;
  }

  if ("expiry" in values && hasError(parsed.error, ["card", "expiry"])) {
    return false;
  }

  if ("cvc" in values && hasError(parsed.error, ["card", "cvc"])) {
    return false;
  }

  return true;
}

export function isAcceptedBrand(
  acceptedBrands: CardBrandName[] | undefined,
  cardNumberValidationResult: CardNumberValidationResult
): boolean {
  if (!acceptedBrands?.length) return true;

  if (!cardNumberValidationResult.isValid) return false;
  const { brand, localBrands } = cardNumberValidationResult;

  const acceptedBrandsSet = new Set(acceptedBrands);

  const isBrandAccepted = brand !== null && acceptedBrandsSet.has(brand);
  const isLocalBrandAccepted = localBrands.some((localBrand) =>
    acceptedBrandsSet.has(localBrand)
  );

  return isBrandAccepted || isLocalBrandAccepted;
}

export function formatExpiry(expiry: string) {
  const parsedExpiry = validateExpiry(expiry);

  if (!parsedExpiry.isValid) {
    return null;
  }

  return {
    month: parsedExpiry.month!,
    year: parsedExpiry.year!,
  };
}

export function formatNumber(number: string) {
  return number.replace(/\s/g, "");
}
