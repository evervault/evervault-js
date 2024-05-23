import {
  NativeSyntheticEvent,
  TextInput,
  TextInputFocusEventData,
} from 'react-native';

interface CardHolderProps {
  disabled?: boolean;
  autoFocus?: boolean;
  onChange: (v: string) => void;
  onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  placeholder: string;
  value: string;
  readOnly?: boolean;
}

export function CardHolder({
  autoFocus,
  disabled,
  onChange,
  onBlur,
  placeholder,
  value,
  readOnly,
}: CardHolderProps) {
  return (
    <TextInput
      id="name"
      value={value}
      readOnly={readOnly}
      onBlur={onBlur}
      autoFocus={autoFocus}
      editable={disabled}
      selectTextOnFocus={disabled}
      placeholder={placeholder}
      autoComplete="cc-name"
      onChangeText={(v) => onChange(v)}
    />
  );
}
