import { TextInputMask } from 'react-native-masked-text';
import { removeFieldFromSet, useCardContext } from './context';
import * as React from 'react';
import { useEffect } from 'react';
import { BaseProps } from './Card';

export interface CardExpiryProps extends BaseProps {}

export function CardExpiry(props: CardExpiryProps) {
  const context = useCardContext();

  const { onBlur, onChange } = context.register('expiry');

  useEffect(() => {
    context.setRegisteredFields((prev) => new Set(prev).add('expiry'));
    return () =>
      context.setRegisteredFields((prev) => removeFieldFromSet(prev, 'expiry'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TextInputMask
      {...props}
      type="datetime"
      value={context.values.expiry}
      // store the expiry as MMYY not MM / YY
      onChangeText={(rawExpiry) => onChange(rawExpiry.replace(' / ', ''))}
      options={{
        format: '99 / 99',
      }}
      id="expiry"
      onBlur={onBlur}
      placeholder={props.placeholder ?? 'MM / YY'}
      inputMode="numeric"
      autoComplete="cc-exp"
    />
  );
}
