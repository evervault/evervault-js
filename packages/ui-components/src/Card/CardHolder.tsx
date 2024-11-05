import { FocusEvent } from "react";

interface CardHolderProps {
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
}

export function CardHolder({
  autoFocus,
  disabled,
  onChange,
  onBlur,
  onFocus,
  onKeyUp,
  onKeyDown,
  placeholder,
  value,
  readOnly,
  autoComplete,
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
      autoComplete={autoComplete ? "billing cc-name" : "off"}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onKeyUp={onKeyUp}
      onKeyDown={onKeyDown}
    />
  );
}
