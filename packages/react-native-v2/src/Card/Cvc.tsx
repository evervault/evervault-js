import { forwardRef, useMemo } from "react";
import { BaseEvervaultInputProps, EvervaultInput, mask } from "../Input";
import { CardFormValues } from "./schema";
import { Mask } from "react-native-mask-input";
import { validateNumber } from "@evervault/card-validator";
import { useFormContext } from "react-hook-form";
import { CardBrandName } from "./types";

const DEFAULT_CARD_CVC_MASK = mask("999");

const CARD_CVC_MASKS: Partial<Record<CardBrandName, Mask>> = {
  "american-express": mask("9999"),
};

export type CardCvcProps = BaseEvervaultInputProps;

export type CardCvc = EvervaultInput;

export const CardCvc = forwardRef<CardCvc, CardCvcProps>(function CardCvc(
  props,
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
