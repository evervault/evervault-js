import { forwardRef, useMemo } from "react";
import { BaseEvervaultInputProps, EvervaultInput, mask } from "../Input";
import { CardFormValues } from "./schema";
import { Mask } from "react-native-mask-input";
import { validateNumber } from "@evervault/card-validator";
import { useFormContext } from "react-hook-form";
import { CardBrandName } from "./types";

const DEFAULT_CARD_CVC_MASK = mask("[999]");

const CARD_CVC_MASKS: Partial<Record<CardBrandName, Mask>> = {
  "american-express": mask("[9999]"),
};

export interface CardCvcProps extends BaseEvervaultInputProps {
  /**
   * Whether to obfuscate the entire CVC value.
   *
   * If a string is provided, it will be used to obfuscate the value.
   */
  obfuscateValue?: boolean | string;
}

export type CardCvc = EvervaultInput;

export const CardCvc = forwardRef<CardCvc, CardCvcProps>(function CardCvc(
  props,
  ref
) {
  const methods = useFormContext<{ card: CardFormValues }>();

  const number = methods.watch("card.number");
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
    <EvervaultInput<{ card: CardFormValues }>
      placeholder="CVC"
      {...props}
      ref={ref}
      name="card.cvc"
      mask={mask}
      inputMode="numeric"
      autoComplete="cc-csc"
      keyboardType="number-pad"
    />
  );
});
