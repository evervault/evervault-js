import { validateNumber } from '@evervault/card-validator';
import { useMemo, useRef } from 'react';
import { TextInputMask } from 'react-native-masked-text';
import { MASKS } from 'shared';
import { useCardContext } from './context';

interface CardNumberProps {
  disabled?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  readOnly?: boolean;
}

export function CardNumber({
  autoFocus,
  disabled,
  placeholder,
  readOnly,
}: CardNumberProps) {
  const context = useCardContext();
  const ref = useRef<TextInputMask>(null);

  const [innerValue, mask] = useMemo(() => {
    const value = context.values.number;

    const { brand } = validateNumber(value);

    if (brand) {
      //@ts-ignore
      return [value, MASKS.native.number[brand] ?? MASKS.native.number.default];
    }
    return [value, MASKS.native.number.unionpay];
  }, [context.values.number]);

  const { onBlur, onChange } = context.registerFn('number');

  return (
    <TextInputMask
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
