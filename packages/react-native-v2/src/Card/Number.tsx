import { ForwardedRef, forwardRef, useCallback } from "react";
import { BaseEvervaultInputProps, EvervaultInput, mask } from "../Input";
import { CardFormValues } from "./schema";
import { MaskArray } from "react-native-mask-input";
import { validateNumber } from "@evervault/card-validator";
import { CardBrandName } from "./types";
import { mergeRefs } from "../utils";

const DEFAULT_CARD_NUMBER_MASK = mask("9999 9999 9999 9999");

const CARD_NUMBER_MASKS: Partial<Record<CardBrandName, MaskArray>> = {
  unionpay: mask("9999 9999 9999 9999 999"),
  "american-express": mask("9999 999999 99999"),
};

export type CardNumberProps = BaseEvervaultInputProps;

export type CardNumber = EvervaultInput;

export const CardNumber = forwardRef<CardNumber, CardNumberProps>(
  function CardNumber(props, ref) {
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
        {...props}
        ref={ref}
        name="number"
        mask={mask}
        inputMode="numeric"
        autoComplete="cc-number"
        keyboardType="number-pad"
      />
    );
  }
);
