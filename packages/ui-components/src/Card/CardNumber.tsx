import { validateNumber } from "@evervault/card-validator";
import { FocusEvent, useMemo, useEffect, useRef } from "react";
import { UseFormReturn } from "shared";
import { useMask } from "../utilities/useMask";
import { CardForm } from "./types";
import type { CustomBrand } from "types";

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
  customBrands?: CustomBrand[];
}

interface CardMask {
  mask: string;
  brand?: string;
  cardLength?: number;
}

function cardMaskFromLength(length: number): string {
  const parts = [];
  let remaining = length;
  while (remaining > 0) {
    parts.push("0".repeat(Math.min(4, remaining)));
    remaining -= 4;
  }
  return parts.join(" ");
}

const BASE_MASKS: CardMask[] = [
  { mask: "0000 0000 0000 0000", cardLength: 16 },
  { mask: "0000 0000 0000 0000 000", brand: "unionpay", cardLength: 19 },
  { mask: "0000 000000 00000", brand: "american-express", cardLength: 15 },
];

const BASE_LENGTHS = new Set(BASE_MASKS.map((m) => m.cardLength));

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
  customBrands,
}: CardNumberProps) {
  const ref = useRef<HTMLInputElement>(null);

  const masks = useMemo<CardMask[]>(() => {
    if (!customBrands?.length) return BASE_MASKS;
    const extra: CardMask[] = [];
    const seen = new Set(BASE_LENGTHS);
    for (const brand of customBrands) {
      const maxLength = Math.max(...brand.numberValidationRules.lengths);
      if (!seen.has(maxLength)) {
        seen.add(maxLength);
        extra.push({
          mask: cardMaskFromLength(maxLength),
          cardLength: maxLength,
        });
      }
    }
    return [...BASE_MASKS, ...extra];
  }, [customBrands]);

  const handleCardChange = (newValue: string) => {
    const { brand, localBrands } = validateNumber(newValue, { customBrands });
    const customBrandAllows4DigitCvc = customBrands?.some(
      (b) =>
        localBrands.includes(b.name) &&
        b.securityCodeValidationRules.lengths.includes(4)
    );
    const allows4DigitCvc =
      brand === "american-express" || customBrandAllows4DigitCvc;

    if (!allows4DigitCvc && form.values.cvc.length > 3) {
      form.setValues((previous) => ({
        ...previous,
        cvc: previous.cvc.slice(0, 3),
      }));
    }

    onChange(newValue);
  };

  const { setValue, mask } = useMask(ref, handleCardChange, {
    mask: masks as CardMask[],
    dispatch: (appended, dynamicMasked) => {
      const number = dynamicMasked.value + appended;
      const { brand, localBrands } = validateNumber(number, { customBrands });

      if (localBrands.length > 0 && customBrands) {
        const matchedCustom = customBrands.find((b) =>
          localBrands.includes(b.name)
        );
        if (matchedCustom) {
          const maxLength = Math.max(
            ...matchedCustom.numberValidationRules.lengths
          );
          const customMask = dynamicMasked.compiledMasks.find(
            (m) => (m as CardMask).cardLength === maxLength
          );
          if (customMask) return customMask;
        }
      }

      const brandMask = dynamicMasked.compiledMasks.find((m) => {
        const maskBrand = (m as CardMask).brand;
        return maskBrand === brand;
      });

      return brandMask ?? dynamicMasked.compiledMasks[0];
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
