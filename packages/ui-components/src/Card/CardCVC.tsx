import { validateNumber } from "@evervault/card-validator";
import {
  FocusEvent,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { useMask } from "../utilities/useMask";
import type { CustomBrand } from "types";

export function getCVCMask(
  cardNumber: string,
  customBrands?: CustomBrand[]
): string {
  if (!cardNumber) return "0000";
  const { brand, localBrands } = validateNumber(cardNumber, { customBrands });
  if (brand === "american-express") return "0000";

  const matchedCustomBrand = customBrands?.find((b) =>
    localBrands.includes(b.name)
  );
  if (matchedCustomBrand) {
    const maxLength = Math.max(
      ...matchedCustomBrand.securityCodeValidationRules.lengths
    );
    return "0".repeat(maxLength);
  }

  return "000";
}

interface CVCProps {
  onChange: (v: string) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled: boolean;
  placeholder?: string;
  value: string;
  readOnly?: boolean;
  cardNumber: string;
  autoComplete?: boolean;
  redact?: boolean;
  customBrands?: CustomBrand[];
}

export const CardCVC = forwardRef<HTMLInputElement, CVCProps>(
  (
    {
      cardNumber,
      onChange,
      onBlur,
      disabled,
      placeholder,
      value,
      readOnly,
      autoComplete,
      onFocus,
      onKeyUp,
      onKeyDown,
      redact,
      customBrands,
    },
    forwardedRef
  ) => {
    const innerRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(forwardedRef, () => innerRef.current!);

    const mask = useMemo(
      () => getCVCMask(cardNumber, customBrands),
      [cardNumber, customBrands]
    );

    const { setValue } = useMask(innerRef, onChange, {
      mask,
    });

    useEffect(() => {
      setValue(value);
    }, [setValue, value]);

    return (
      <input
        ref={innerRef}
        id="cvc"
        name="cvc"
        type={redact ? "password" : "text"}
        disabled={disabled}
        onBlur={onBlur}
        placeholder={placeholder}
        pattern="[0-9]*"
        inputMode="numeric"
        autoComplete={autoComplete ? "billing cc-csc" : "off"}
        readOnly={readOnly}
        onFocus={onFocus}
        onKeyUp={onKeyUp}
        onKeyDown={onKeyDown}
      />
    );
  }
);
