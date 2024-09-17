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

interface CVCProps {
  onChange: (v: string) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  disabled: boolean;
  placeholder?: string;
  value: string;
  readOnly?: boolean;
  cardNumber: string;
  autoComplete?: boolean;
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
    },
    forwardedRef
  ) => {
    const innerRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(forwardedRef, () => innerRef.current!);

    const mask = useMemo(() => {
      if (!cardNumber) return "0000";
      const type = validateNumber(cardNumber).brand;
      if (type === "american-express") return "0000";
      return "000";
    }, [cardNumber]);

    const { setValue, getUnmaskedValue } = useMask(innerRef, onChange, {
      mask,
    });

    // When the mask changes we want to ensure the correct value is set.
    // e.g if a the user previously entered a 4 digit cvc and then enters
    // a card that only supports 3 then we force the value to be 3 digits.
    useEffect(() => {
      if (value !== getUnmaskedValue()) {
        onChange(getUnmaskedValue() || "");
      }
    }, [value, mask, getUnmaskedValue, onChange]);

    useEffect(() => {
      setValue(value);
    }, [setValue, value]);

    return (
      <input
        ref={innerRef}
        id="cvc"
        name="cvc"
        type="text"
        disabled={disabled}
        onBlur={onBlur}
        placeholder={placeholder}
        pattern="[0-9]*"
        autoComplete={autoComplete ? "billing cc-cvc" : "off"}
        readOnly={readOnly}
      />
    );
  }
);
