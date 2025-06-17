import { z } from "zod";
import {
  validateNumber,
  validateCVC,
  validateExpiry,
} from "@evervault/card-validator";
import { CardBrandName } from "./types";
import { isAcceptedBrand } from "./utils";

export interface CardFormSchemaOptions {
  acceptedBrands: CardBrandName[];
  allow3DigitAmexCVC?: boolean;
}

export function getCardSchema(options: CardFormSchemaOptions) {
  const allow3DigitAmexCVC = options.allow3DigitAmexCVC ?? true;

  return z
    .object({
      name: z.string().min(1, "Missing name"),

      number: z
        .string()
        .min(1, "Required")
        .transform((value) => value.replace(/\s/g, ""))
        .refine((value) => validateNumber(value).isValid, {
          message: "Invalid card number",
        })
        .refine(
          (value) =>
            isAcceptedBrand(options.acceptedBrands, validateNumber(value)),
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
    })
    .transform((data) => {
      const { brand } = validateNumber(data.number);
      if (brand && brand !== "american-express" && data.cvc.length > 3) {
        return {
          ...data,
          cvc: data.cvc.slice(0, 3),
        };
      } else {
        return data;
      }
    })
    .refine(
      (data) => {
        const { brand } = validateNumber(data.number);
        const isInvalid =
          brand === "american-express" &&
          data.cvc?.length === 3 &&
          !allow3DigitAmexCVC;
        return !isInvalid;
      },
      {
        path: ["cvc"],
        message: "Invalid CVC",
      }
    );
}

export type CardFormValues = z.infer<ReturnType<typeof getCardSchema>>;
