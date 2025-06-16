import { Platform } from "react-native";
import { forwardRef } from "react";
import { BaseEvervaultInputProps, EvervaultInput } from "../Input";
import { CardFormValues } from "./schema";

export type CardHolderProps = BaseEvervaultInputProps;

export type CardHolder = EvervaultInput;

export const CardHolder = forwardRef<CardHolder, CardHolderProps>(
  function CardHolder(props, ref) {
    return (
      <EvervaultInput<{ card: CardFormValues }>
        placeholder="Johnny Appleseed"
        {...props}
        ref={ref}
        name="card.name"
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
