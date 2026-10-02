import { FocusEvent, useEffect, useRef } from "react";
import { yearFromAutofill } from "shared/expiry";
import { useMask } from "../utilities/useMask";
import { EXPIRY_BLOCKS } from "./CardExpiry";
import type { ExpiryHalves } from "./expiry";

interface CardExpiryHalfProps {
  half: keyof ExpiryHalves;
  onChange: (value: string) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled: boolean;
  placeholder?: string;
  value: string;
  readOnly?: boolean;
  autoComplete?: boolean;
  autoProgress: boolean;
  onComplete?: () => void;
}

const HALVES = {
  month: {
    id: "expiry-month",
    mask: "MM",
    autoComplete: "billing cc-exp-month",
  },
  year: { id: "expiry-year", mask: "YY", autoComplete: "billing cc-exp-year" },
};

const YEAR_BLOCK = {
  ...EXPIRY_BLOCKS.YY,
  prepare: yearFromAutofill,
};

export function CardExpiryHalf({
  half,
  onChange,
  onBlur,
  disabled,
  placeholder,
  value,
  readOnly,
  autoComplete,
  autoProgress,
  onComplete,
  onFocus,
  onKeyUp,
  onKeyDown,
}: CardExpiryHalfProps) {
  const ref = useRef<HTMLInputElement>(null);
  const { id, mask: pattern, autoComplete: token } = HALVES[half];
  const { setValue, mask } = useMask(ref, onChange, {
    mask: pattern,
    blocks: {
      MM: EXPIRY_BLOCKS.MM,
      YY: YEAR_BLOCK,
    } as typeof useMask.prototype.blocks,
  });

  useEffect(() => {
    const isComplete = mask.current?.masked.isComplete ?? false;
    const isFocused = document.activeElement === ref.current;
    if (autoProgress && isFocused && isComplete) {
      onComplete?.();
    }
  }, [value, autoProgress, mask, onComplete]);

  useEffect(() => {
    setValue(value);
  }, [setValue, value]);

  return (
    <input
      ref={ref}
      type="text"
      id={id}
      name={id}
      disabled={disabled}
      onBlur={onBlur}
      placeholder={placeholder}
      pattern="[0-9]*"
      inputMode="numeric"
      autoComplete={autoComplete ? token : "off"}
      readOnly={readOnly}
      onFocus={onFocus}
      onKeyUp={onKeyUp}
      onKeyDown={onKeyDown}
    />
  );
}
