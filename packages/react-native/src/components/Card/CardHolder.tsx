import { useEffect } from 'react';
import * as React from 'react';
import { Platform, TextInput } from 'react-native';
import { removeFieldFromSet, useCardContext } from './context';
import { BaseProps } from './Card';

export interface CardHolderProps extends BaseProps {
  autoFocus?: boolean;
}

export function CardHolder({
  autoFocus,
  disabled,
  placeholder,
  readOnly,
  style,
}: CardHolderProps) {
  const context = useCardContext();

  const { onBlur, onChange } = context.register('name');

  useEffect(() => {
    context.setRegisteredFields((prev) => new Set(prev).add('name'));
    return () =>
      context.setRegisteredFields((prev) => removeFieldFromSet(prev, 'name'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TextInput
      id="name"
      style={style}
      value={context.values.name}
      readOnly={readOnly}
      onBlur={onBlur}
      autoFocus={autoFocus}
      editable={disabled}
      selectTextOnFocus={disabled}
      placeholder={placeholder}
      autoComplete={Platform.select({
        ios: 'cc-name',
        android: 'name',
      })}
      onChangeText={(v) => onChange(v)}
    />
  );
}
