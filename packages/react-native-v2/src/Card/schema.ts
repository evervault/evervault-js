import { z } from "zod";
import { validateNumber, validateExpiry } from "@evervault/card-validator";
import { CardBrandName } from "./types";
import { isAcceptedBrand, isCvcComplete, nameMatches } from "./utils";
import type { CardField } from "./types";
import type { CardSettings } from "./utils";

// The CVC is validated against the card number.
export function getCardFormSchema(
  acceptedBrands: CardBrandName[],
  settings: CardSettings = {},
  cardNumber = ""
) {
  const { name = {}, number = {}, expiry = {}, cvc = {} } = settings;

  // Fields start out as `undefined` until the shopper types in them. Zod v4
  // reports that with a generic type error ahead of any refinements, which
  // would hide our "Required" (or customised) message, so it's named here
  // instead of relying on the default.
  const requiredString = (message: string) =>
    z.string({
      error: (issue) => (issue.input === undefined ? message : undefined),
    });

  return z.object({
    name: requiredString(name.errorMessage ?? "Missing name")
      .min(1, name.errorMessage ?? "Missing name")
      .refine((value) => nameMatches(value, name), {
        message: name.errorMessage ?? "Invalid name",
      }),

    number: requiredString(number.errorMessage ?? "Required")
      .min(1, number.errorMessage ?? "Required")
      .refine((value) => validateNumber(value).isValid, {
        message: number.errorMessage ?? "Invalid card number",
      })
      .refine(
        (value) => isAcceptedBrand(acceptedBrands, validateNumber(value)),
        { message: number.unsupportedBrandMessage ?? "Brand not accepted" }
      ),

    expiry: requiredString(expiry.errorMessage ?? "Required")
      .min(1, expiry.errorMessage ?? "Required")
      .refine((value) => validateExpiry(value).isValid, {
        message: expiry.errorMessage ?? "Invalid expiry",
      }),

    cvc: (cvc.optional
      ? requiredString(cvc.errorMessage ?? "Required")
      : requiredString(cvc.errorMessage ?? "Required").min(
          1,
          cvc.errorMessage ?? "Required"
        )
    ).refine((value) => isCvcComplete(value, cardNumber, cvc), {
      message: cvc.errorMessage ?? "Invalid CVC",
    }),
  } satisfies Record<CardField, z.ZodTypeAny>);
}

export type CardFormValues = z.infer<ReturnType<typeof getCardFormSchema>>;
