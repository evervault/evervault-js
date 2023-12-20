import { FocusEvent, useEffect, useRef } from "react";
import { useMask } from "../utilities/useMask";

interface CardHolderProps {
  disabled?: boolean;
  autoFocus?: boolean;
  onChange: (v: string) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  placeholder: string;
  value: string;
  readOnly?: boolean;
}

export function CardHolder({
  autoFocus,
  disabled,
  onChange,
  onBlur,
  placeholder,
  value,
  readOnly,
}: CardHolderProps) {
  return (
    <input
      type="text"
      id="number"
      name="number"
      value={value}
      readOnly={readOnly}
      inputMode="numeric"
      onBlur={onBlur}
      autoFocus={autoFocus}
      disabled={disabled}
      placeholder={placeholder}
      pattern="[0-9]*"
      autoComplete="billing cc-name"
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
