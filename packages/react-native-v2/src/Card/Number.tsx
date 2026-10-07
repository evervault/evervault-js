import { forwardRef, useCallback } from "react";
import { AutoProgressProps, EvervaultInput, mask } from "../Input";
import type { CardFieldBaseProps } from "./props";
import { CardFormValues } from "./schema";
import { MaskArray } from "react-native-mask-input";
import { validateNumber } from "@evervault/card-validator";
import { CardBrandName } from "./types";
import { declaredField } from "./declaredFields";

const DEFAULT_CARD_NUMBER_MASK = mask("9999 99[99 9999 9999]");

const CARD_NUMBER_MASKS: Partial<Record<CardBrandName, MaskArray>> = {
  unionpay: mask("9999 99[99 9999 9999 999]"),
  "american-express": mask("9999 99[9999 99999]"),
};

export interface CardNumberProps extends CardFieldBaseProps, AutoProgressProps {
  /**
   * Whether to obfuscate the card number value (excluding the last 4 digits).
   *
   * If a string is provided, it will be used to obfuscate the value.
   */
  obfuscateValue?: boolean | string;

  /**
   * Replaces the text of the error for a card whose brand the card does not
   * accept.
   */
  unsupportedBrandMessage?: string;
}

export type CardNumber = EvervaultInput;

const CardNumberElement = forwardRef<CardNumber, CardNumberProps>(
  function CardNumber(
    { errorMessage, unsupportedBrandMessage, ...props },
    ref
  ) {
    const mask = useCallback((text?: string): MaskArray => {
      if (!text) {
        return DEFAULT_CARD_NUMBER_MASK;
      }

      const brand = validateNumber(text).brand;
      if (brand && CARD_NUMBER_MASKS[brand]) {
        return CARD_NUMBER_MASKS[brand];
      }

      return DEFAULT_CARD_NUMBER_MASK;
    }, []);

    return (
      <EvervaultInput<CardFormValues>
        placeholder="1234 1234 1234 1234"
        {...props}
        ref={ref}
        name="number"
        mask={mask}
        inputMode="numeric"
        autoComplete="cc-number"
        textContentType="creditCardNumber"
        keyboardType="number-pad"
      />
    );
  }
);

export const CardNumber = declaredField("number", CardNumberElement, [
  "errorMessage",
  "unsupportedBrandMessage",
]);
