import { FocusEvent } from "react";

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
      id="name"
      name="name"
      value={value}
      readOnly={readOnly}
      onBlur={onBlur}
      autoFocus={autoFocus}
      disabled={disabled}
      placeholder={placeholder}
      autoComplete="billing cc-name"
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
