import { forwardRef } from "react";
import { BaseEvervaultInputProps, EvervaultInput, mask } from "../Input";
import { CardFormValues } from "./schema";

const CARD_EXPIRY_MASK = mask("99 / 99");

export type CardExpiryProps = BaseEvervaultInputProps;

export type CardExpiry = EvervaultInput;

export const CardExpiry = forwardRef<CardExpiry, CardExpiryProps>(
  function CardExpiry(props, ref) {
    return (
      <EvervaultInput<CardFormValues>
        {...props}
        ref={ref}
        name="expiry"
        mask={CARD_EXPIRY_MASK}
        inputMode="numeric"
        autoComplete="cc-exp"
        keyboardType="number-pad"
      />
    );
  }
);
