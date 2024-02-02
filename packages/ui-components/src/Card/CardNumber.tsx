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
    mask: "0000 0000 0000 0000 000",
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
