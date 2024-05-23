import type { CardForm } from './types';
import { TextInputMask } from 'react-native-masked-text';
import { NativeSyntheticEvent, TextInputFocusEventData } from 'react-native';

interface CardExpiryProps {
  onChange: (value: CardForm['expiry']) => void;
  onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  disabled: boolean;
  placeholder?: string;
  value: string;
  readOnly?: boolean;
}

export function CardExpiry({
  onChange,
  onBlur,
  disabled,
  placeholder,
  value,
  readOnly,
}: CardExpiryProps) {
  return (
    <TextInputMask
      type="datetime"
      value={value}
      editable={disabled}
      selectTextOnFocus={disabled}
      onChangeText={(t) => onChange(t)}
      options={{
        format: '99 / 99',
      }}
      id="expiry"
      onBlur={onBlur}
      placeholder={placeholder ?? 'MM / YY'}
      autoComplete="cc-exp"
      readOnly={readOnly}
    />
  );
}
