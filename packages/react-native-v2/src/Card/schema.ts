import { z } from "zod";
import {
  validateNumber,
  validateCVC,
  validateExpiry,
  CardNumberValidationResult,
} from "@evervault/card-validator";
import { CARD_BRAND_NAMES, CardBrandName } from "./types";

function isAcceptedBrand(
  acceptedBrands: CardBrandName[] | undefined,
  cardNumberValidationResult: CardNumberValidationResult
): boolean {
  if (!acceptedBrands) return true;
  const { brand, localBrands } = cardNumberValidationResult;

  const isBrandAccepted = brand !== null && acceptedBrands.includes(brand);
  const isLocalBrandAccepted = localBrands.some((localBrand) =>
    acceptedBrands.includes(localBrand)
  );

  return isBrandAccepted || isLocalBrandAccepted;
}

export const cardFormSchema = z
  .object({
    acceptedBrands: z.array(z.enum(CARD_BRAND_NAMES)),

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
    if (!value.acceptedBrands.length) return;

    const validation = validateNumber(value.number);
    if (!validation.isValid) return;

    const isAccepted = isAcceptedBrand(value.acceptedBrands, validation);
    if (!isAccepted) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Brand not accepted",
        path: ["number"],
      });
    }
  });

export type CardFormValues = z.infer<typeof cardFormSchema>;
