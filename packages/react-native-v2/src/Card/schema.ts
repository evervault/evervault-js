import { z } from "zod";
import { validateNumber, validateExpiry } from "@evervault/card-validator";
import { CardBrandName } from "./types";
import { isAcceptedBrand, isCvcComplete, nameMatches } from "./utils";
import type { CardInputName, CardSettingsByField } from "./fieldSettings";

// The security code is judged against the number, as the web card judges it.
export function getCardFormSchema(
  acceptedBrands: CardBrandName[],
  settings: CardSettingsByField = {},
  cardNumber = ""
) {
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
    ).refine((value) => isCvcComplete(value, cardNumber, cvc), {
      message: cvc.errorMessage ?? "Invalid CVC",
    }),
  } satisfies Record<CardInputName, z.ZodTypeAny>);
}

export type CardFormValues = z.infer<ReturnType<typeof getCardFormSchema>>;
