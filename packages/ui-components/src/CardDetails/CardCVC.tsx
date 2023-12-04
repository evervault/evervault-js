import { FocusEvent, forwardRef } from "react";
import { IMaskInput } from "react-imask";

type CVCProps = {
  onChange: (v: string) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  disabled: boolean;
  placeholder?: string;
  value: string;
  readOnly?: boolean;
};

export const CardCVC = forwardRef<HTMLInputElement, CVCProps>(
  ({ onChange, onBlur, disabled, placeholder, value, readOnly }, ref) => {
    return (
      <IMaskInput
        unmask
        value={value}
        id="cvc"
        name="cvc"
        type="text"
        mask="0000"
        disabled={disabled}
        onAccept={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        pattern="[0-9]*"
        autoComplete="billing cc-cvc"
        inputRef={ref}
        readOnly={readOnly}
      />
    );
  }
);
