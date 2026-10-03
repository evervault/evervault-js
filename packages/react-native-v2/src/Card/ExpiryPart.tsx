import { forwardRef } from "react";
import {
  AutoProgressProps,
  BaseEvervaultInputProps,
  EvervaultInput,
  mask,
} from "../Input";
import { CardFormValues } from "./schema";
import { useCardFieldSettings } from "./fieldSettings";
import { declaredField } from "./declaredFields";

const PART_MASK = mask("99");

// Both halves write the one expiry, "MMYY", the month padded while partial.
function month(stored: string) {
  return stored.slice(0, 2).trim();
}

function year(stored: string) {
  return stored.slice(2);
}

function join(typedMonth: string, typedYear: string) {
  return typedYear ? typedMonth.padEnd(2, " ") + typedYear : typedMonth;
}

export interface CardExpiryPartProps
  extends BaseEvervaultInputProps,
    AutoProgressProps {
  /**
   * Replaces the text of the expiry's error in the payload's `errors`; either
   * half may declare it.
   */
  errorMessage?: string;
}

export type CardExpiryMonthProps = CardExpiryPartProps;

export type CardExpiryMonth = EvervaultInput;

const CardExpiryMonthElement = forwardRef<
  CardExpiryMonth,
  CardExpiryMonthProps
>(function CardExpiryMonth({ errorMessage, ...props }, ref) {
  useCardFieldSettings("expiry", { errorMessage });

  return (
    <EvervaultInput<CardFormValues>
      id="expiry-month"
      placeholder="MM"
      {...props}
      ref={ref}
      name="expiry"
      mask={PART_MASK}
      read={month}
      write={(typed, stored) => join(typed, year(stored))}
      // Moving into the other half while it's empty isn't finishing the date.
      checksOnBlur={(stored, focused) =>
        !(focused === "expiry-year" && year(stored).length === 0)
      }
      inputMode="numeric"
      autoComplete="cc-exp-month"
      keyboardType="number-pad"
    />
  );
});

export type CardExpiryYearProps = CardExpiryPartProps;

export type CardExpiryYear = EvervaultInput;

const CardExpiryYearElement = forwardRef<CardExpiryYear, CardExpiryYearProps>(
  function CardExpiryYear({ errorMessage, ...props }, ref) {
    useCardFieldSettings("expiry", { errorMessage });

    return (
      <EvervaultInput<CardFormValues>
        id="expiry-year"
        placeholder="YY"
        {...props}
        ref={ref}
        name="expiry"
        mask={PART_MASK}
        read={year}
        write={(typed, stored) => join(month(stored), typed)}
        checksOnBlur={(stored, focused) =>
          !(focused === "expiry-month" && month(stored).length === 0)
        }
        inputMode="numeric"
        autoComplete="cc-exp-year"
        keyboardType="number-pad"
      />
    );
  }
);

export const CardExpiryMonth = declaredField(
  "expiryMonth",
  CardExpiryMonthElement
);

export const CardExpiryYear = declaredField(
  "expiryYear",
  CardExpiryYearElement
);
