import { Platform } from "react-native";
import { forwardRef } from "react";
import { BaseEvervaultInputProps, EvervaultInput } from "../Input";
import { CardFormValues } from "./schema";
import { useCardFieldSettings } from "./fieldSettings";

export interface CardHolderProps extends BaseEvervaultInputProps {
  /**
   * Replaces the text of this field's error in the payload's `errors`.
   */
  errorMessage?: string;

  /**
   * A pattern the whole name must match, as HTML's `pattern`.
   */
  pattern?: string;
}

export type CardHolder = EvervaultInput;

export const CardHolder = forwardRef<CardHolder, CardHolderProps>(
  function CardHolder({ errorMessage, pattern, ...props }, ref) {
    useCardFieldSettings("name", { errorMessage, pattern });

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
