import { forwardRef } from "react";
import { yearFromAutofill } from "shared/expiry";
import {
  AutoProgressProps,
  BaseEvervaultInputProps,
  EvervaultInput,
} from "../Input";
import { CardFormValues } from "./schema";
import { declaredField } from "./declaredFields";

const digits = (typed: string) => typed.replace(/\D/g, "");

// A month as typed, kept between 01 and 12: a first digit above 1 is padded
// with a 0, and a second digit that would leave that range is dropped.
function monthFromTyped(typed: string): string {
  const [first = "", second = ""] = digits(typed);

  if (first === "") return "";
  if (Number(first) > 1) return `0${first}`;
  if (second === "") return first;

  const month = Number(first + second);
  return month >= 1 && month <= 12 ? first + second : first;
}

// A year typed digit by digit stops at two; one filled in by the browser as
// four digits is cut to two, as on the web.
function yearFromTyped(typed: string) {
  const entered = digits(typed);
  return entered.length === 4 ? yearFromAutofill(entered) : entered.slice(0, 2);
}

const isFull = (shown: string) => shown.length === 2;

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

export interface CardExpiryHalfProps
  extends BaseEvervaultInputProps,
    AutoProgressProps {
  /**
   * Replaces the text of the expiry's error in the payload's `errors`; either
   * half may declare it.
   */
  errorMessage?: string;
}

export type CardExpiryMonthProps = CardExpiryHalfProps;

export type CardExpiryMonth = EvervaultInput;

const CardExpiryMonthElement = forwardRef<
  CardExpiryMonth,
  CardExpiryMonthProps
>(function CardExpiryMonth({ errorMessage, ...props }, ref) {
  return (
    <EvervaultInput<CardFormValues>
      placeholder="MM"
      {...props}
      ref={ref}
      id="expiry-month"
      name="expiry"
      limit={2}
      isFull={isFull}
      read={month}
      write={(typed, stored) => join(monthFromTyped(typed), year(stored))}
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

export type CardExpiryYearProps = CardExpiryHalfProps;

export type CardExpiryYear = EvervaultInput;

const CardExpiryYearElement = forwardRef<CardExpiryYear, CardExpiryYearProps>(
  function CardExpiryYear({ errorMessage, ...props }, ref) {
    return (
      <EvervaultInput<CardFormValues>
        placeholder="YY"
        {...props}
        ref={ref}
        id="expiry-year"
        name="expiry"
        limit={4}
        isFull={isFull}
        read={year}
        write={(typed, stored) => join(month(stored), yearFromTyped(typed))}
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
  CardExpiryMonthElement,
  ["errorMessage"]
);

export const CardExpiryYear = declaredField(
  "expiryYear",
  CardExpiryYearElement,
  ["errorMessage"]
);
