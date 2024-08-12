import { useEffect } from 'react';
import * as React from 'react';
import { Platform, TextInput } from 'react-native';
import { useCardContext } from './context';
import { BaseProps } from './Card';

export interface CardHolderProps extends BaseProps {}

export function CardHolder(props: CardHolderProps) {
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
      {...props}
      id="name"
      value={context.values.name}
      onBlur={onBlur}
      autoComplete={Platform.select({
        ios: 'cc-name',
        android: 'name',
      })}
      onChangeText={(v) => onChange(v)}
    />
  );
}
