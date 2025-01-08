import IMask from "imask";
import { FocusEvent, useEffect, useRef } from "react";
import { useMask } from "../utilities/useMask";
import type { CardForm } from "./types";

interface CardExpiryProps {
  onChange: (value: CardForm["expiry"]) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled: boolean;
  placeholder?: string;
  value: string;
  readOnly?: boolean;
  autoComplete?: boolean;
  autoProgress?: boolean;
}

const EXPIRY_BLOCKS = {
  MM: {
    mask: IMask.MaskedRange,
    placeholderChar: "MM",
    from: 1,
    to: 12,
    maxLength: 2,
    autofix: "pad",
  },
  YY: {
    mask: IMask.MaskedRange,
    placeholderChar: "YY",
    from: 0,
    to: 99,
    maxLength: 2,
  },
};

export function CardExpiry({
  onChange,
  onBlur,
  disabled,
  placeholder,
  value,
  readOnly,
  autoComplete,
  autoProgress,
  onFocus,
  onKeyUp,
  onKeyDown,
}: CardExpiryProps) {
  const ref = useRef<HTMLInputElement>(null);
  const { setValue, mask } = useMask(ref, onChange, {
    mask: "MM / YY",
    blocks: EXPIRY_BLOCKS as typeof useMask.prototype.blocks,
  });

  useEffect(() => {
    const isComplete = mask.current?.masked.isComplete ?? false;
    const activeField = document.activeElement as HTMLElement;
    const isFocused = activeField === ref.current;
    if (autoProgress && isFocused && isComplete) {
      document.getElementById("cvc")?.focus();
    }
  }, [value, autoProgress, mask]);

  useEffect(() => {
    setValue(value);
  }, [setValue, value]);

  return (
    <input
      ref={ref}
      type="text"
      id="expiry"
      name="expiry"
      disabled={disabled}
      onBlur={onBlur}
      placeholder={placeholder}
      pattern="[0-9]*"
      inputMode="numeric"
      autoComplete={autoComplete ? "billing cc-exp" : "off"}
      readOnly={readOnly}
      onFocus={onFocus}
      onKeyUp={onKeyUp}
      onKeyDown={onKeyDown}
    />
  );
}
