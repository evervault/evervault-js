import { TextInputMask } from 'react-native-masked-text';
import { useCardContext } from './context';
import { useEffect } from 'react';
import { BaseProps } from './Card';

export interface CardExpiryProps extends BaseProps { }

export function CardExpiry({
  disabled,
  placeholder,
  readOnly,
  style
}: CardExpiryProps) {
  const context = useCardContext();

  const { onBlur, onChange } = context.register('expiry');

  useEffect(() => {
    context.setRegisteredFields((prev) => new Set(prev).add('expiry'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TextInputMask
      style={style}
      type="datetime"
      value={context.values.expiry}
      editable={disabled}
      selectTextOnFocus={disabled}
      // store the expiry as MMYY not MM / YY
      onChangeText={(rawExpiry) => onChange(rawExpiry.replace(' / ', ''))}
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
