import { useEffect } from 'react';
import * as React from 'react';
import { TextInput } from 'react-native';
import { useCardContext } from './context';
import { BaseProps } from './Card';

export interface CardHolderProps extends BaseProps {}

export function CardHolder({ disabled, readOnly, ...props }: CardHolderProps) {
  const context = useCardContext();

  const { onBlur, onChange } = context.register('name');

  useEffect(() => {
    context.setRegisteredFields((prev) => new Set(prev).add('name'));
    return () =>
      context.setRegisteredFields((prev) => {
        const next = new Set(prev);
        next.delete('name');
        return next;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TextInput
      id="name"
      value={context.values.name}
      readOnly={readOnly}
      onBlur={onBlur}
      editable={disabled}
      selectTextOnFocus={disabled}
      autoComplete="cc-name"
      onChangeText={(v) => onChange(v)}
      {...props}
    />
  );
}
