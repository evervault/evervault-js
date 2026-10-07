import { Platform } from "react-native";
import { forwardRef } from "react";
import { EvervaultInput } from "../Input";
import type { CardFieldBaseProps } from "./props";
import { CardFormValues } from "./schema";
import { declaredField } from "./declaredFields";

export interface CardHolderProps extends CardFieldBaseProps {
  /**
   * A pattern the whole name must match, as HTML's `pattern`.
   */
  pattern?: string;

  /**
   * The name the field starts with. A changed default replaces only a name
   * the shopper hasn't changed.
   */
  defaultValue?: string;
}

export type CardHolder = EvervaultInput;

const CardHolderElement = forwardRef<CardHolder, CardHolderProps>(
  function CardHolder({ errorMessage, pattern, defaultValue, ...props }, ref) {
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
        textContentType="creditCardName"
        keyboardType="default"
      />
    );
  }
);

export const CardHolder = declaredField("name", CardHolderElement, [
  "errorMessage",
  "pattern",
  "defaultValue",
]);
