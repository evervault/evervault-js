import { forwardRef } from "react";
import { BaseEvervaultInputProps, EvervaultInput, mask } from "../Input";
import { CardFormValues } from "./schema";

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

export type CardExpiryMonthProps = BaseEvervaultInputProps;

export type CardExpiryMonth = EvervaultInput;

export const CardExpiryMonth = forwardRef<
  CardExpiryMonth,
  CardExpiryMonthProps
>(function CardExpiryMonth(props, ref) {
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
      inputMode="numeric"
      autoComplete="cc-exp-month"
      keyboardType="number-pad"
    />
  );
});

export type CardExpiryYearProps = BaseEvervaultInputProps;

export type CardExpiryYear = EvervaultInput;

export const CardExpiryYear = forwardRef<CardExpiryYear, CardExpiryYearProps>(
  function CardExpiryYear(props, ref) {
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
        inputMode="numeric"
        autoComplete="cc-exp-year"
        keyboardType="number-pad"
      />
    );
  }
);
