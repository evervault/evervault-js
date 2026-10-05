import {
  validateNumber,
  validateExpiry,
  validateCVC,
  CardNumberValidationResult,
} from "@evervault/card-validator";
import type { CardBrandName, CardPayload } from "./types";
import { type CardFormValues } from "./schema";
import { DeepPartial, UseFormReturn } from "react-hook-form";
import { type Encrypted, sdk } from "../sdk";
import type { CustomFieldProps } from "shared/customField";
import { customFieldKey, customFieldMessage } from "./customFields";

export interface FormatPayloadContext {
  form: UseFormReturn<CardFormValues>;
  encrypt<T>(data: T): Promise<Encrypted<T>>;
  customFields?: ReadonlyMap<string, CustomFieldProps>;
}

interface CustomFieldsPayload {
  fields: Record<string, string | null>;
  errors: Record<string, string>;
  isComplete: boolean;
}

// A field's error is reported once the card has checked it, as a card field's
// is; until then it only holds the card back from complete.
async function formatCustomFields(
  context: FormatPayloadContext
): Promise<CustomFieldsPayload | null> {
  if (!context.customFields?.size) return null;

  const fields: [string, string | null][] = [];
  const errors: [string, string][] = [];
  let isComplete = true;

  for (const [name, field] of context.customFields) {
    const key = customFieldKey(name) as keyof CardFormValues;
    const value = (context.form.getValues(key) as string | undefined) ?? "";
    const error = customFieldMessage(value, field);
    const shown = context.form.getFieldState(key).error?.message;

    fields.push([
      name,
      value.length > 0 && !error ? await context.encrypt(value) : null,
    ]);

    if (error) isComplete = false;
    if (shown) errors.push([name, shown]);
  }

  // Built from entries, so a name such as "__proto__" is a key like any other.
  return {
    fields: Object.fromEntries(fields),
    errors: Object.fromEntries(errors),
    isComplete,
  };
}

export async function formatPayload(
  values: DeepPartial<CardFormValues>,
  context: FormatPayloadContext
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
    context.form.setValue("cvc", values.cvc?.slice(0, 3));
  }

  const { cvc, isValid: isCvcValid } = validateCVC(values.cvc ?? "", number);

  const formErrors = context.form.formState.errors;
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

  const custom = await formatCustomFields(context);
  const customComplete = custom?.isComplete ?? true;

  return {
    card: {
      name: values.name ?? null,
      brand,
      localBrands,
      bin,
      lastFour,
      expiry: formatExpiry(values.expiry ?? ""),
      number: isNumberValid ? await context.encrypt(number) : null,
      cvc: isCvcValid ? await context.encrypt(cvc ?? "") : null,
    },
    ...(custom && { fields: custom.fields }),
    isComplete: isComplete && customComplete,
    isValid: isValid && isComplete && customComplete,
    errors:
      custom && Object.keys(custom.errors).length > 0
        ? { ...errors, fields: custom.errors }
        : errors,
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
