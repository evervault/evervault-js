import {
  validateNumber,
  validateExpiry,
  CardNumberValidationResult,
} from "@evervault/card-validator";
import type { CardBrandName, CardPayload } from "./types";
import {
  CardFormSchemaOptions,
  cardSchema,
  parseCard,
  ParsedCardResult,
  type CardFormValues,
} from "./schema";
import { DeepPartial, FieldErrors } from "react-hook-form";
import { type Encrypted } from "../sdk";
import { z } from "zod";

function getError(error: z.ZodError | undefined, path: string[]) {
  if (!error) return undefined;
  return error.issues.find((issue) => issue.path.join(".") === path.join("."));
}

function hasError(error: z.ZodError | undefined, path: string[]) {
  return !!getError(error, path);
}

export interface FormatPayloadContext {
  options: CardFormSchemaOptions;
  errors: FieldErrors<CardFormValues>;
  encrypt<T>(data: T): Promise<Encrypted<T>>;
}

export async function formatPayload(
  { card }: DeepPartial<{ card: CardFormValues }>,
  context: FormatPayloadContext
): Promise<CardPayload> {
  const values = card ?? {};
  const parsed = parseCard(values, context.options);

  const isValid = !Object.keys(context.errors).length;
  const isComplete = areValuesComplete(values, parsed);

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

  if (context.errors.name?.message) {
    payload.errors.name = context.errors.name.message;
  } else if (parsed.data.name) {
    payload.card.name = parsed.data.name;
  }

  if (context.errors.number?.message) {
    payload.errors.number = context.errors.number.message;
  } else if (parsed.data.number) {
    const result = validateNumber(parsed.data.number);
    payload.card.brand = result.brand;
    payload.card.localBrands = result.localBrands;
    payload.card.bin = result.bin;
    payload.card.lastFour = result.lastFour;
    payload.card.number = await context.encrypt(parsed.data.number);
  }

  if (context.errors.expiry?.message) {
    payload.errors.expiry = context.errors.expiry.message;
  } else if (parsed.data.expiry) {
    const expiry = validateExpiry(parsed.data.expiry);
    payload.card.expiry = { month: expiry.month!, year: expiry.year! };
  }

  if (context.errors.cvc?.message) {
    payload.errors.cvc = context.errors.cvc.message;
  } else if (parsed.data.cvc) {
    payload.card.cvc = await context.encrypt(parsed.data.cvc);
  }

  return payload;
}

export function areValuesComplete(
  values: DeepPartial<CardFormValues>,
  parsed: ParsedCardResult
) {
  if ("name" in values && hasError(parsed.error, ["name"])) {
    return false;
  }

  if ("number" in values && hasError(parsed.error, ["number"])) {
    return false;
  }

  if ("expiry" in values && hasError(parsed.error, ["expiry"])) {
    return false;
  }

  if ("cvc" in values && hasError(parsed.error, ["cvc"])) {
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
