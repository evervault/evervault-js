import { useEffect } from 'react';
import { TextInput } from 'react-native';
import { useCardContext } from './context';
import { BaseProps } from './Card';

export interface CardHolderProps extends BaseProps {
  autoFocus?: boolean;
}

export function CardHolder({
  autoFocus,
  disabled,
  placeholder,
  readOnly,
}: CardHolderProps) {
  const context = useCardContext();

  const { onBlur, onChange } = context.register('name');

  useEffect(() => {
    context.setRegisteredFields((prev) => new Set(prev).add('name'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TextInput
      id="name"
      value={context.values.name}
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
