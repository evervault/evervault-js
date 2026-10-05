import { Platform } from "react-native";
import { forwardRef } from "react";
import { BaseEvervaultInputProps, EvervaultInput } from "../Input";
import { CardFormValues } from "./schema";
import { declaredField } from "./declaredFields";

export type CardHolderProps = BaseEvervaultInputProps;

export type CardHolder = EvervaultInput;

const CardHolderElement = forwardRef<CardHolder, CardHolderProps>(
  function CardHolder(props, ref) {
    return (
      <EvervaultInput<CardFormValues>
        placeholder="Johnny Appleseed"
        {...props}
        ref={ref}
        name="name"
        inputMode="text"
        autoComplete={Platform.select({
          ios: "cc-name",
          default: "name",
        })}
        keyboardType="default"
      />
    );
  }
);

export const CardHolder = declaredField("name", CardHolderElement, []);
