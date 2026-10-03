import {
  validateNumber,
  validateExpiry,
  validateCVC,
  CardNumberValidationResult,
  CardNumberValidationOptions,
} from "@evervault/card-validator";
import { PromisifiedEvervaultClient } from "@evervault/react";
import { customFieldError, isRefusedAmexCvc, UseFormReturn } from "shared";
import type { CustomFieldError } from "shared";
import { ICONS } from "./icons";
import type { CustomFieldProps } from "./customField";
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

// `errors` holds only the errors shown so far.
export interface CustomFields {
  declared: Map<string, CustomFieldProps>;
  values: Map<string, string>;
  errors: Map<string, CustomFieldError>;
}

export async function changePayload(
  ev: PromisifiedEvervaultClient,
  form: UseFormReturn<CardForm>,
  fields: CardField[],
  custom: CustomFields,
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
  const checked = checkedFields(custom);

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
    fields: await encryptedFields(ev, checked),
    isValid: form.isValid && custom.errors.size === 0,
    isComplete: isComplete(form, fields, opts) && allValid(checked),
    errors: payloadErrors(form, custom),
  };
}

function payloadErrors(
  form: UseFormReturn<CardForm>,
  custom: CustomFields
): CardPayload["errors"] {
  const card = Object.keys(form.errors ?? {}).length > 0 ? form.errors : null;

  if (custom.errors.size === 0) return card;

  return { ...card, fields: Object.fromEntries(custom.errors) };
}

interface CheckedField {
  value: string;
  error: CustomFieldError | undefined;
}

// Each declared field's value with its error, shown yet or not.
function checkedFields({
  declared,
  values,
}: Pick<CustomFields, "declared" | "values">): Map<string, CheckedField> {
  return new Map(
    [...declared].map(([name, field]) => {
      const value = values.get(name) ?? "";
      return [name, { value, error: customFieldError(field, value) }];
    })
  );
}

function allValid(checked: Map<string, CheckedField>) {
  return [...checked.values()].every(({ error }) => !error);
}

export function customComplete(
  custom: Pick<CustomFields, "declared" | "values">
) {
  return allValid(checkedFields(custom));
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

    if (
      isRefusedAmexCvc(
        form.values.cvc,
        cardValidation.brand,
        opts?.allow3DigitAmexCVC
      )
    ) {
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

// Every declared field is reported, an empty or invalid one as null.
async function encryptedFields(
  ev: PromisifiedEvervaultClient,
  checked: Map<string, CheckedField>
): Promise<Record<string, string | null>> {
  const entries = await Promise.all(
    [...checked].map(async ([name, { value, error }]) => {
      const valid = value.length > 0 && !error;
      return [name, valid ? await ev.encrypt(value) : null];
    })
  );

  return Object.fromEntries(entries);
}

async function encryptedCVC(
  ev: PromisifiedEvervaultClient,
  cvc: string,
  cardNumber: string,
  opts?: CardNumberValidationOptions
) {
  const { isValid } = validateCVC(cvc, cardNumber, opts);

  if (!isValid) return null;
  return ev.encrypt(cvc);
}

export function collectIcons(icons: boolean | Partial<CardIcons>) {
  if (typeof icons === "boolean") return ICONS;
  return { ...ICONS, ...icons };
}
