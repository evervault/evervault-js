import MaskInput from 'react-native-mask-input';
import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { MASKS } from "shared";
import type { NativeSyntheticEvent, TextInput, TextInputFocusEventData } from "react-native";
import { validateNumber } from '@evervault/card-validator';

interface CVCProps {
  onChange: (v: string) => void;
  onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  disabled: boolean;
  placeholder?: string;
  value: string;
  readOnly?: boolean;
  cardNumber: string;
}

export const CardCVC = forwardRef<TextInput, CVCProps>(
  (
    { cardNumber, onChange, onBlur, disabled, placeholder, value, readOnly },
    forwardedRef
  ) => {
    const innerRef = useRef<TextInput>(null);

    useImperativeHandle(forwardedRef, () => innerRef.current!);

    const mask = useMemo(() => {
      const type = validateNumber(cardNumber).brand;
      if (type === "american-express") return MASKS.native.cvc.americanExpress;
      return MASKS.native.cvc.default;
    }, [cardNumber]);


    return (
      <MaskInput
        mask={mask}
        value={value}
        onChangeText={(masked) => onChange(masked)}
        ref={innerRef}
        id="cvc"
        editable={disabled}
        selectTextOnFocus={disabled}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete="cc-csc"
        readOnly={readOnly}
      />
    );
  }
);
