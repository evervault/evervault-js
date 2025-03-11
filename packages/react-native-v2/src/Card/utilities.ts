import {
  validateNumber,
  validateExpiry,
  validateCVC,
  CardNumberValidationResult,
} from "@evervault/card-validator";
import type { CardBrandName, CardPayload } from "./types";
import { type CardFormValues } from "./schema";
import { DeepPartial, FieldError, UseFormReturn } from "react-hook-form";
import { sdk } from "../sdk";

export async function formatPayload(
  values: DeepPartial<CardFormValues>,
  form: UseFormReturn<CardFormValues>
): Promise<CardPayload> {
  const number = values.number?.replace(/\s/g, "") || "";

  const {
    brand,
    localBrands,
    bin,
    lastFour,
    isValid: isNumberValid,
  } = validateNumber(number);

  if (
    number.length > 0 &&
    brand !== "american-express" &&
    values.cvc?.length === 4
  ) {
    form.setValue("cvc", values.cvc?.slice(0, 3));
  }

  const { cvc, isValid: isCvcValid } = validateCVC(values.cvc ?? "", number);

  const formErrors = form.formState.errors;
  const isValid = !Object.keys(formErrors).length;
  const isComplete = areValuesComplete(values);

  const errors: Record<string, string> = {};
  if (formErrors.name?.message) {
    errors.name = formErrors.name.message;
  }
  if (formErrors.number?.message) {
    errors.number = formErrors.number.message;
  }
  if (formErrors.expiry?.message) {
    errors.expiry = formErrors.expiry.message;
  }
  if (formErrors.cvc?.message) {
    errors.cvc = formErrors.cvc.message;
  }

  return {
    card: {
      name: values.name ?? null,
      brand,
      localBrands,
      bin,
      lastFour,
      expiry: formatExpiry(values.expiry ?? ""),
      number: isNumberValid ? await sdk.encrypt(number) : null,
      cvc: isCvcValid ? await sdk.encrypt(cvc ?? "") : null,
    },
    isComplete,
    isValid: isValid && isComplete,
    errors: isValid ? null : errors,
  };
}

export function areValuesComplete(values: DeepPartial<CardFormValues>) {
  if ("name" in values && !values.name?.length) {
    return false;
  }

  if ("number" in values && !validateNumber(values.number ?? "").isValid) {
    return false;
  }

  if ("expiry" in values && !validateExpiry(values.expiry ?? "").isValid) {
    return false;
  }

  if (
    "cvc" in values &&
    !validateCVC(values.cvc ?? "", values.number).isValid
  ) {
    return false;
  }

  return true;
}

export function isAcceptedBrand(
  acceptedBrands: CardBrandName[] | undefined,
  cardNumberValidationResult: CardNumberValidationResult
): boolean {
  if (!acceptedBrands?.length) return true;
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
