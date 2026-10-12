import { forwardRef, useMemo } from "react";
import { AutoProgressProps, EvervaultInput, mask } from "../Input";
import type { CardFieldBaseProps } from "./props";
import { CardFormValues } from "./schema";
import { Mask } from "react-native-mask-input";
import { validateNumber } from "@evervault/card-validator";
import { useFormContext } from "react-hook-form";
import { CardBrandName } from "./types";
import { declaredField } from "./declaredFields";

const DEFAULT_CARD_CVC_MASK = mask("[999]");

const CARD_CVC_MASKS: Partial<Record<CardBrandName, Mask>> = {
  "american-express": mask("[9999]"),
};

export interface CardCvcProps extends CardFieldBaseProps, AutoProgressProps {
  /**
   * Whether to obfuscate the entire CVC value.
   *
   * If a string is provided, it will be used to obfuscate the value.
   */
  obfuscateValue?: boolean | string;

  /**
   * Whether the card is complete without a security code.
   *
   * @default false
   */
  optional?: boolean;

  /**
   * Whether an American Express security code may be 3 digits rather than 4.
   *
   * @default true
   */
  allow3DigitAmex?: boolean;
}

export type CardCvc = EvervaultInput;

const CardCvcElement = forwardRef<CardCvc, CardCvcProps>(function CardCvc(
  { errorMessage, optional, allow3DigitAmex, ...props },
  ref
) {
  const methods = useFormContext<CardFormValues>();

  const number = methods.watch("number");
  const mask = useMemo<Mask>(() => {
    if (!number) {
      return DEFAULT_CARD_CVC_MASK;
    }

    const brand = validateNumber(number).brand;
    if (brand && CARD_CVC_MASKS[brand]) {
      return CARD_CVC_MASKS[brand];
    }

    return DEFAULT_CARD_CVC_MASK;
  }, [number]);

  return (
    <EvervaultInput<CardFormValues>
      placeholder="CVC"
      {...props}
      ref={ref}
      name="cvc"
      mask={mask}
      inputMode="numeric"
      autoComplete="cc-csc"
      keyboardType="number-pad"
    />
  );
});

export const CardCvc = declaredField("cvc", CardCvcElement, [
  "errorMessage",
  "optional",
  "allow3DigitAmex",
]);
