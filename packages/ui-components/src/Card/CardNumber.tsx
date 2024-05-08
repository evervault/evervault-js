import { validateNumber } from "@evervault/card-validator";
import { FocusEvent, useEffect, useRef } from "react";
import { useMask } from "../utilities/useMask";

interface CardNumberProps {
  disabled?: boolean;
  autoFocus?: boolean;
  onChange: (v: string) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  placeholder: string;
  value: string;
  readOnly?: boolean;
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
  readOnly,
}: CardNumberProps) {
  const ref = useRef<HTMLInputElement>(null);
  const { setValue } = useMask(ref, onChange, {
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
      autoComplete="billing cc-number"
    />
  );
}
