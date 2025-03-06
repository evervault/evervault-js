import { useFormContext } from "react-hook-form";
import {
  NativeSyntheticEvent,
  Platform,
  TextInput,
  TextInputFocusEventData,
  TextInputProps,
} from "react-native";
import { CardFormValues } from "./schema";
import { useCallback } from "react";

const CARD_HOLDER_AUTOCOMPLETE = Platform.select({
  ios: "cc-name" as const,
  default: "name" as const,
});

export type CardHolderProps = Omit<
  TextInputProps,
  "onChange" | "onChangeText" | "value"
>;

export function CardHolder(props: CardHolderProps) {
  const methods = useFormContext<CardFormValues>();
  const field = methods.register("name");

  const onBlur = useCallback(
    (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
      field.onBlur(event);
      props.onBlur?.(event);
    },
    [field.onBlur, props.onBlur]
  );

  return (
    <TextInput
      // Overridable props
      id={field.name}
      maxLength={field.maxLength}
      autoComplete={CARD_HOLDER_AUTOCOMPLETE}
      keyboardType="default"
      {...props}
      // Strict props
      ref={field.ref}
      editable={!field.disabled && (props.editable ?? true)}
      onBlur={onBlur}
      onChange={field.onChange}
      onChangeText={undefined}
      value={undefined}
      inputMode="text"
    />
  );
}
