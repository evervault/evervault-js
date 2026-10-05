import { forwardRef } from "react";
import { EvervaultInput, mask } from "../Input";
import type { CardFieldBaseProps } from "./props";
import { CardFormValues } from "./schema";
import { declaredField } from "./declaredFields";

const CARD_EXPIRY_MASK = mask("99 / 99");

export type CardExpiryProps = CardFieldBaseProps;

export type CardExpiry = EvervaultInput;

const CardExpiryElement = forwardRef<CardExpiry, CardExpiryProps>(
  function CardExpiry({ errorMessage, ...props }, ref) {
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

export const CardExpiry = declaredField("expiry", CardExpiryElement, [
  "errorMessage",
]);
