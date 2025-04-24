import { z } from "zod";
import {
  validateNumber,
  validateCVC,
  validateExpiry,
} from "@evervault/card-validator";
import { CardBrandName } from "./types";
import { isAcceptedBrand } from "./utils";

export function getCardFormSchema(acceptedBrands: CardBrandName[]) {
  return z.object({
    name: z.string().min(1, "Missing name"),

    number: z
      .string()
      .min(1, "Required")
      .refine((value) => validateNumber(value).isValid, {
        message: "Invalid card number",
      })
      .refine(
        (value) => isAcceptedBrand(acceptedBrands, validateNumber(value)),
        { message: "Brand not accepted" }
      ),

    expiry: z
      .string()
      .min(1, "Required")
      .refine((value) => validateExpiry(value).isValid, {
        message: "Invalid expiry",
      }),

    cvc: z
      .string()
      .min(1, "Required")
      .refine((value) => validateCVC(value).isValid, {
        message: "Invalid CVC",
      }),
  });
}

export type CardFormValues = z.infer<ReturnType<typeof getCardFormSchema>>;
