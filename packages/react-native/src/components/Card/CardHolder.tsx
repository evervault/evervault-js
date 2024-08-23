import { useEffect } from "react";
import * as React from "react";
import { Platform, TextInput } from "react-native";
import { removeFieldFromSet, useCardContext } from "./context";
import { BaseProps } from "./Card";

export interface CardHolderProps extends BaseProps {}

export function CardHolder(props: CardHolderProps) {
  const context = useCardContext();

  const { onBlur, onChange } = context.register("name");

  useEffect(() => {
    context.setRegisteredFields((prev) => new Set(prev).add("name"));
    return () =>
      context.setRegisteredFields((prev) => removeFieldFromSet(prev, "name"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TextInput
      {...props}
      id="name"
      value={context.values.name}
      onBlur={(e) => {
        onBlur(e);
        props.onBlur?.(e);
      }}
      autoComplete={Platform.select({
        ios: "cc-name",
        android: "name",
      })}
      onChangeText={(v) => onChange(v)}
    />
  );
}
