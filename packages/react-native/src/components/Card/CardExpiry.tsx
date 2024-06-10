import { TextInputMask } from 'react-native-masked-text';
import { useCardContext } from './context';
import * as React from 'react';
import { useEffect } from 'react';
import { BaseProps } from './Card';

export interface CardExpiryProps extends BaseProps {}

export function CardExpiry({
  disabled,
  placeholder,
  readOnly,
  ...props
}: CardExpiryProps) {
  const context = useCardContext();

  const { onBlur, onChange } = context.register('expiry');

  useEffect(() => {
    context.setRegisteredFields((prev) => new Set(prev).add('expiry'));
    return () =>
      context.setRegisteredFields((prev) => {
        const next = new Set(prev);
        next.delete('expiry');
        return next;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TextInputMask
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
      inputMode="numeric"
      autoComplete="cc-exp"
      readOnly={readOnly}
      {...props}
    />
  );
}
