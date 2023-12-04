import IMask from "imask";
import { CardDetailsForm } from ".";
import { FocusEvent, useEffect, useRef } from "react";
import { useMask } from "../utilities/useMask";

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
  const ref = useRef<HTMLInputElement>(null);
  const [unmasked, setValue] = useMask(ref, {
    mask: "MM / YY",
    blocks: EXPIRY_BLOCKS,
  });

  useEffect(() => {
    onChange(unmasked);
  }, [unmasked]);

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
