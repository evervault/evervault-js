import { validateNumber } from '@evervault/card-validator';
import { useEffect, useMemo, useRef } from 'react';
import { TextInputMask } from 'react-native-masked-text';
import { useCardContext } from './context';
import { BaseProps } from './Card';

interface CardNumberProps extends BaseProps {
  autoFocus?: boolean;
}

export function CardNumber({
  autoFocus,
  disabled,
  placeholder,
  readOnly,
  style,
}: CardNumberProps) {
  const context = useCardContext();
  const ref = useRef<TextInputMask>(null);

  const [innerValue, mask] = useMemo(() => {
    const value = context.values.number;

    const { brand } = validateNumber(value);

    const masks = {
      'default': '9999 9999 9999 9999',
      'unionpay': '9999 9999 9999 9999 999',
      'american-express': '9999 999999 99999',
    } as Record<string, string>;

    if (brand && !!masks[brand]) {
      return [value, masks[brand]];
    }
    return [value, masks.default];
  }, [context.values.number]);

  const { onBlur, onChange } = context.register('number');

  useEffect(() => {
    context.setRegisteredFields((prev) => new Set(prev).add('number'));
    return () => context.setRegisteredFields((prev) => {
      const next = new Set(prev);
      next.delete('name');
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TextInputMask
      style={style}
      ref={ref}
      type="custom"
      options={{ mask }}
      id="number"
      value={innerValue}
      onChangeText={onChange}
      onBlur={onBlur}
      readOnly={readOnly}
      inputMode="numeric"
      autoFocus={autoFocus}
      placeholder={placeholder}
      editable={disabled}
      selectTextOnFocus={disabled}
      autoComplete="cc-number"
    />
  );
}
