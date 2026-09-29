import { forwardRef } from "react";
import {
  AutoProgressProps,
  BaseEvervaultInputProps,
  EvervaultInput,
  mask,
} from "../Input";
import { CardFormValues } from "./schema";
import { useCardFieldSettings } from "./fieldSettings";

const CARD_EXPIRY_MASK = mask("99 / 99");

export interface CardExpiryProps
  extends BaseEvervaultInputProps,
    AutoProgressProps {
  /**
   * Replaces the text of this field's error in the payload's `errors`.
   */
  errorMessage?: string;
}

export type CardExpiry = EvervaultInput;

export const CardExpiry = forwardRef<CardExpiry, CardExpiryProps>(
  function CardExpiry({ errorMessage, ...props }, ref) {
    useCardFieldSettings("expiry", { errorMessage });

    return (
      <EvervaultInput<CardFormValues>
        placeholder="MM / YY"
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
