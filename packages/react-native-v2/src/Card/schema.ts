import { z } from "zod";
import {
  validateNumber,
  validateCVC,
  validateExpiry,
} from "@evervault/card-validator";
import { CardBrandName } from "./types";
import { isAcceptedBrand, isRefusedAmexCvc, nameMatches } from "./utils";
import type { CardInputName, CardSettingsByField } from "./fieldSettings";

// The number decides whether a 3-digit security code passes on an Amex card.
export function getCardFormSchema(
  acceptedBrands: CardBrandName[],
  settings: CardSettingsByField = {},
  cardNumber = ""
) {
  const refusedAmexCvc = (value: string) =>
    isRefusedAmexCvc(value, cardNumber, settings.cvc?.allow3DigitAmex);

  const { name = {}, number = {}, expiry = {}, cvc = {} } = settings;

  return z.object({
    name: z
      .string()
      .min(1, name.errorMessage ?? "Missing name")
      .refine((value) => nameMatches(value, name), {
        message: name.errorMessage ?? "Invalid name",
      }),

    number: z
      .string()
      .min(1, number.errorMessage ?? "Required")
      .refine((value) => validateNumber(value).isValid, {
        message: number.errorMessage ?? "Invalid card number",
      })
      .refine(
        (value) => isAcceptedBrand(acceptedBrands, validateNumber(value)),
        { message: number.unsupportedBrandMessage ?? "Brand not accepted" }
      ),

    expiry: z
      .string()
      .min(1, expiry.errorMessage ?? "Required")
      .refine((value) => validateExpiry(value).isValid, {
        message: expiry.errorMessage ?? "Invalid expiry",
      }),

    cvc: (cvc.optional
      ? z.string()
      : z.string().min(1, cvc.errorMessage ?? "Required")
    ).refine(
      (value) =>
        (cvc.optional && value === "") ||
        (validateCVC(value).isValid && !refusedAmexCvc(value)),
      { message: cvc.errorMessage ?? "Invalid CVC" }
    ),
  } satisfies Record<CardInputName, z.ZodTypeAny>);
}

export type CardFormValues = z.infer<ReturnType<typeof getCardFormSchema>>;
