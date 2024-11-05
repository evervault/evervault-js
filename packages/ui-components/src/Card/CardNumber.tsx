import { validateNumber } from "@evervault/card-validator";
import { FocusEvent, useEffect, useRef } from "react";
import { UseFormReturn } from "shared";
import { useMask } from "../utilities/useMask";
import { CardForm } from "./types";

interface CardNumberProps {
  disabled?: boolean;
  autoFocus?: boolean;
  onChange: (v: string) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder: string;
  value: string;
  readOnly?: boolean;
  autoComplete?: boolean;
  autoProgress?: boolean;
  form: UseFormReturn<CardForm>;
}

interface CardMask {
  mask: string;
  brand?: string;
}

export function CardNumber({
  autoFocus,
  disabled,
  onChange,
  onBlur,
  placeholder,
  value,
  form,
  readOnly,
  autoComplete,
  autoProgress,
  onFocus,
  onKeyUp,
  onKeyDown,
}: CardNumberProps) {
  const ref = useRef<HTMLInputElement>(null);

  const handleCardChange = (newValue: string) => {
    const { brand } = validateNumber(newValue);
    if (brand !== "american-express" && form.values.cvc.length === 4) {
      form.setValues((previous) => ({
        ...previous,
        cvc: previous.cvc.slice(0, 3),
      }));
    }

    onChange(newValue);
  };

  const { setValue, mask } = useMask(ref, handleCardChange, {
    mask: [
      {
        mask: "0000 0000 0000 0000",
      },
      {
        mask: "0000 0000 0000 0000 000",
        brand: "unionpay",
      },
      {
        mask: "0000 000000 00000",
        brand: "american-express",
      },
    ] as CardMask[],
    dispatch: (appended, dynamicMasked) => {
      const number = dynamicMasked.value + appended;
      const { brand } = validateNumber(number);

      const mask = dynamicMasked.compiledMasks.find((m) => {
        const maskBrand = (m as CardMask).brand;
        return maskBrand === brand;
      });

      return mask ?? dynamicMasked.compiledMasks[0];
    },
  });

  useEffect(() => {
    const isComplete = mask.current?.masked.isComplete ?? false;
    const activeField = document.activeElement as HTMLElement;
    const isFocused = activeField === ref.current;
    if (autoProgress && isFocused && isComplete) {
      document.getElementById("expiry")?.focus();
    }
  }, [value, mask, autoProgress]);

  useEffect(() => {
    setValue(value);
  }, [setValue, value]);

  return (
    <input
      ref={ref}
      type="text"
      id="number"
      name="number"
      readOnly={readOnly}
      inputMode="numeric"
      onBlur={onBlur}
      autoFocus={autoFocus}
      disabled={disabled}
      placeholder={placeholder}
      pattern="[0-9]*"
      autoComplete={autoComplete ? "billing cc-number" : "off"}
      onFocus={onFocus}
      onKeyUp={onKeyUp}
      onKeyDown={onKeyDown}
    />
  );
}
