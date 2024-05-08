import {validateNumber} from "@evervault/card-validator";
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
}

export const CardCVC = forwardRef<HTMLInputElement, CVCProps>(
  (
    { cardNumber, onChange, onBlur, disabled, placeholder, value, readOnly },
    forwardedRef
  ) => {
    const innerRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(forwardedRef, () => innerRef.current!);

    const mask = useMemo(() => {
      const type = validateNumber(cardNumber).brand;
      if (type === "american-express") return "0000";
      return "000";
    }, [cardNumber]);

    const { setValue } = useMask(innerRef, onChange, { mask });

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
        autoComplete="billing cc-cvc"
        readOnly={readOnly}
      />
    );
  }
);
