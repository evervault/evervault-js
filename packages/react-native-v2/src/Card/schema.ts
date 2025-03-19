import { z } from "zod";
import {
  validateNumber,
  validateCVC,
  validateExpiry,
} from "@evervault/card-validator";
import { CardBrandName } from "./types";
import { isAcceptedBrand } from "./utils";

export function getCardFormSchema(acceptedBrands: CardBrandName[]) {
  return z
    .object({
      name: z.string().min(1, "Missing name"),

      number: z
        .string()
        .min(1, "Required")
        .refine((value) => validateNumber(value).isValid, {
          message: "Invalid card number",
        }),

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
    })
    .superRefine((value, ctx) => {
      const validation = validateNumber(value.number);
      if (!validation.isValid) return;

      const isAccepted = isAcceptedBrand(acceptedBrands, validation);
      if (!isAccepted) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Brand not accepted",
          path: ["number"],
        });
      }
    });
}

export type CardFormValues = z.infer<ReturnType<typeof getCardFormSchema>>;
