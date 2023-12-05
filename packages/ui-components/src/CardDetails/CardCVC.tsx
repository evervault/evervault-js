import {
  FocusEvent,
  forwardRef,
  useEffect,
  useImperativeHandle,
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
}

export const CardCVC = forwardRef<HTMLInputElement, CVCProps>(
  (
    { onChange, onBlur, disabled, placeholder, value, readOnly },
    forwardedRef
  ) => {
    const innerRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(forwardedRef, () => innerRef.current!);

    const [unmasked, setValue] = useMask(innerRef, {
      mask: "0000",
    });

    useEffect(() => {
      if (!unmasked) return;
      onChange(unmasked);
    }, [unmasked]);

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
