import IMask from "imask";
import { FocusEvent, useEffect, useRef } from "react";
import { useMask } from "../utilities/useMask";
import type { CardForm } from "./types";

interface CardExpiryProps {
  onChange: (value: CardForm["expiry"]) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  disabled: boolean;
  placeholder?: string;
  value: string;
  readOnly?: boolean;
}

const EXPIRY_BLOCKS = {
  MM: {
    mask: IMask.MaskedRange,
    placeholderChar: "MM",
    from: 1,
    to: 12,
    maxLength: 2,
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
}: CardExpiryProps) {
  const ref = useRef<HTMLInputElement>(null);
  const { setValue } = useMask(ref, onChange, {
    mask: "MM / YY",
    blocks: EXPIRY_BLOCKS,
  });

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
      autoComplete="billing cc-exp"
      readOnly={readOnly}
    />
  );
}
