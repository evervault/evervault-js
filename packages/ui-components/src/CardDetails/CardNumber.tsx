import { FocusEvent } from "react";
import { IMaskInput } from "react-imask";

type CardNumberProps = {
  disabled?: boolean;
  autoFocus?: boolean;
  onChange: (v: string) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  placeholder: string;
  value: string;
  readOnly?: boolean;
};

export function CardNumber({
  autoFocus,
  disabled,
  onChange,
  onBlur,
  placeholder,
  value,
  readOnly,
}: CardNumberProps) {
  return (
    <IMaskInput
      unmask
      type="text"
      id="number"
      name="number"
      value={value}
      readOnly={readOnly}
      mask="0000 0000 0000 0000 000"
      inputMode="numeric"
      onAccept={onChange}
      onBlur={onBlur}
      autoFocus={autoFocus}
      disabled={disabled}
      placeholder={placeholder}
      pattern="[0-9]*"
      autoComplete="billing cc-number"
    />
  );
}
