import {
  validateNumber,
  validateExpiry,
  validateCVC,
  CardNumberValidationResult,
} from "@evervault/card-validator";
import type { CardBrandName, CardField, CardPayload } from "./types";
import { type CardFormValues } from "./schema";
import { DeepPartial, UseFormReturn } from "react-hook-form";
import { type Encrypted, sdk } from "../sdk";
import type { CardInput } from "shared/cardSpec";
import { compilePattern } from "shared/customField";
import type { CustomFieldProps } from "shared/customField";
import type { CardFieldSettings } from "shared/cardFieldSettings";
import { isRefusedAmexCvc } from "shared/cvc";
import type { DeclaredExpiry } from "shared/expiry";
import type { FieldProps } from "shared/fieldProps";
import { customFieldKey, customFieldMessage } from "./customFields";

export type CardSettings = Partial<Record<CardField, FieldProps>>;

// The settings each card field is judged with. The expiry halves share one,
// whose message the later half gives before the other, as on the web.
export function cardFieldSettings(
  declared: ReadonlyMap<CardInput, FieldProps>,
  expiry: DeclaredExpiry
): CardSettings {
  const settings: CardSettings = {
    name: declared.get("name"),
    number: declared.get("number"),
    expiry: declared.get("expiry"),
    cvc: declared.get("cvc"),
  };

  if (expiry?.form === "split") {
    const later = expiry.later === "expiryMonth" ? "month" : "year";
    const other = later === "month" ? "year" : "month";

    settings.expiry = {
      errorMessage:
        declared.get(`expiry-${later}`)?.errorMessage ??
        declared.get(`expiry-${other}`)?.errorMessage,
    };
  }

  return settings;
}

export interface FormatPayloadContext {
  form: UseFormReturn<CardFormValues>;
  encrypt<T>(data: T): Promise<Encrypted<T>>;
  customFields?: ReadonlyMap<string, CustomFieldProps>;
  fieldSettings?: CardSettings;
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

  const settings = context.fieldSettings ?? {};
  const { cvc } = validateCVC(values.cvc ?? "", number);
  const isCvcValid = isCvcAccepted(values.cvc ?? "", number, settings.cvc);

  const formErrors = context.form.formState.errors;
  const isValid = !Object.keys(formErrors).length;
  const isComplete = areValuesComplete(values, settings);

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

export function areValuesComplete(
  values: DeepPartial<CardFormValues>,
  settings: CardSettings = {}
) {
  if ("name" in values && !values.name?.length) {
    return false;
  }

  if ("name" in values && !nameMatches(values.name ?? "", settings.name)) {
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
    !isCvcComplete(values.cvc ?? "", values.number ?? "", settings.cvc)
  ) {
    return false;
  }

  return true;
}

// A security code valid for the number that the field's settings accept.
export function isCvcAccepted(
  cvc: string,
  number: string,
  settings: CardFieldSettings = {}
) {
  return (
    validateCVC(cvc, number).isValid &&
    !isRefusedAmexCvc(
      cvc,
      validateNumber(number).brand,
      settings.allow3DigitAmex
    )
  );
}

// A security code the card is complete with, which an optional one may leave empty.
export function isCvcComplete(
  cvc: string,
  number: string,
  settings: CardFieldSettings = {}
) {
  return (
    (settings.optional === true && cvc === "") ||
    isCvcAccepted(cvc, number, settings)
  );
}

// A name matching the holder's `pattern`, when it declares one.
export function nameMatches(name: string, settings: CardFieldSettings = {}) {
  const pattern =
    settings.pattern === undefined
      ? undefined
      : compilePattern(settings.pattern);
  return !pattern || pattern.test(name);
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
