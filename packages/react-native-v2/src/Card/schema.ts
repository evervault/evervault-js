import { z } from "zod";
import {
  validateNumber,
  validateCVC,
  validateExpiry,
} from "@evervault/card-validator";
import { CardBrandName } from "./types";
import { isAcceptedBrand } from "./utils";
import { FieldErrors } from "react-hook-form";

export interface ParsedCardResult {
  data: CardFormValues;
  error?: z.ZodError<CardFormValues>;
}

export function parseCard(
  values: Partial<CardFormValues>,
  options: CardFormSchemaOptions
): ParsedCardResult {
  const parsed = cardSchema(options).safeParse(values);
  if (parsed.success) {
    return { data: parsed.data };
  }

  const data: CardFormValues = {
    name: "",
    number: "",
    expiry: "",
    cvc: "",
  };

  const name = nameSchema().safeParse(values.name);
  if (name.success) {
    data.name = name.data;
  }

  const number = numberSchema(options.acceptedBrands).safeParse(values.number);
  if (number.success) {
    data.number = number.data;
  }

  const expiry = expirySchema().safeParse(values.expiry);
  if (expiry.success) {
    data.expiry = expiry.data;
  }

  const cvc = cvcSchema().safeParse(values.cvc);
  if (cvc.success) {
    data.cvc = cvc.data;
  }

  return { data, error: parsed.error };
}

export function nameSchema() {
  return z.string().min(1, "Missing name");
}

export function numberSchema(acceptedBrands: CardBrandName[]) {
  return z
    .string()
    .min(1, "Required")
    .transform((value) => value.replace(/\s/g, ""))
    .refine((value) => validateNumber(value).isValid, {
      message: "Invalid card number",
    })
    .refine((value) => isAcceptedBrand(acceptedBrands, validateNumber(value)), {
      message: "Brand not accepted",
    });
}

export function expirySchema() {
  return z
    .string()
    .min(1, "Required")
    .refine((value) => validateExpiry(value).isValid, {
      message: "Invalid expiry",
    });
}

export function cvcSchema() {
  return z
    .string()
    .min(1, "Required")
    .refine((value) => validateCVC(value).isValid, {
      message: "Invalid CVC",
    });
}

export interface CardFormSchemaOptions {
  acceptedBrands: CardBrandName[];
  allow3DigitAmexCVC?: boolean;
}

export function cardSchema(options: CardFormSchemaOptions) {
  const allow3DigitAmexCVC = options.allow3DigitAmexCVC ?? true;

  return z
    .object({
      name: nameSchema(),
      number: numberSchema(options.acceptedBrands),
      expiry: expirySchema(),
      cvc: cvcSchema(),
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

export type CardFormValues = z.infer<ReturnType<typeof cardSchema>>;
