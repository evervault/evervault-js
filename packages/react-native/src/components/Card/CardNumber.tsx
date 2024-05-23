import { validateNumber } from '@evervault/card-validator';
import { useMemo, useRef } from 'react';
import { NativeSyntheticEvent, TextInputFocusEventData } from 'react-native';
import { TextInputMask } from 'react-native-masked-text';
import { MASKS } from 'shared';

interface CardNumberProps {
  disabled?: boolean;
  autoFocus?: boolean;
  onChange: (v: string) => void;
  onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  placeholder: string;
  value: string;
  readOnly?: boolean;
}


export function CardNumber({
  autoFocus,
  disabled,
  onChange,
  onBlur,
  placeholder,
  value,
  readOnly,
}: CardNumberProps) {
  const ref = useRef<TextInputMask>(null);

  const [innerValue, mask] = useMemo(() => {
    const { brand } = validateNumber(value);

    if (brand) {
      //@ts-ignore
      return [value, MASKS.native.number[brand] ?? MASKS.native.number.default];
    }
    return [value, MASKS.native.number.unionpay];
  }, [value]);

  return (
    <TextInputMask
      ref={ref}
      type="custom"
      options={{ mask }}
      id="number"
      value={innerValue}
      onChangeText={onChange}
      readOnly={readOnly}
      inputMode="numeric"
      onBlur={onBlur}
      autoFocus={autoFocus}
      placeholder={placeholder}
      editable={disabled}
      selectTextOnFocus={disabled}
      autoComplete="cc-number"
    />
  );
}
