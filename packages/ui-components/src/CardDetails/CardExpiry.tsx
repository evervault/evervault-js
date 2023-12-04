import IMask from "imask";
import { IMaskInput } from "react-imask";
import { CardDetailsForm } from ".";
import { FocusEvent } from "react";

type CardExpiryProps = {
  onChange: (value: CardDetailsForm["expiry"]) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  disabled: boolean;
  placeholder?: string;
  value: string;
  readOnly?: boolean;
};

export function CardExpiry({
  onChange,
  onBlur,
  disabled,
  placeholder,
  value,
  readOnly,
}: CardExpiryProps) {
  return (
    <IMaskInput
      unmask
      value={value}
      type="text"
      id="expiry"
      name="expiry"
      mask="MM / YY"
      disabled={disabled}
      onBlur={onBlur}
      onAccept={onChange}
      placeholder={placeholder}
      blocks={EXPIRY_BLOCKS}
      pattern="[0-9]*"
      autoComplete="billing cc-exp"
      readOnly={readOnly}
    />
  );
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
