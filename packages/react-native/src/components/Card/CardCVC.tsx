import { TextInputMask } from 'react-native-masked-text';
import React, { useMemo } from 'react';
import { MASKS } from 'shared';
import {
  NativeSyntheticEvent,
  StyleProp,
  TextInputFocusEventData,
  TextStyle,
} from 'react-native';
import { validateNumber } from '@evervault/card-validator';

interface CVCProps {
  styles: StyleProp<TextStyle>;
  onChange: (v: string) => void;
  onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  disabled: boolean;
  placeholder?: string;
  value: string;
  readOnly?: boolean;
  cardNumber: string;
}

export const CardCVC = ({
  styles,
  cardNumber,
  onChange,
  onBlur,
  disabled,
  placeholder,
  value,
  readOnly,
}: CVCProps) => {
  const mask = useMemo(() => {
    const type = validateNumber(cardNumber).brand;
    if (type === 'american-express')
      return MASKS.native.cvc['american-express'];
    return MASKS.native.cvc.default;
  }, [cardNumber]);

  return (
    <TextInputMask
      type="custom"
      options={{ mask }}
      style={styles}
      value={value}
      onChangeText={(t) => onChange(t)}
      id="cvc"
      editable={disabled}
      selectTextOnFocus={disabled}
      onBlur={onBlur}
      placeholder={placeholder}
      autoComplete="cc-csc"
      readOnly={readOnly}
    />
  );
};
