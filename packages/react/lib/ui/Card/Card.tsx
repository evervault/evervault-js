import * as React from "react";
import type {
  AgentToolsConfig,
  CardBrandName,
  CardField as CardFieldName,
  CardIcons,
  CardOptions,
  CardPayload,
  CardTranslations,
  ColorScheme,
  CustomBrand,
  FieldEvent,
  SwipedCard,
  ThemeDefinition,
} from "types";
import { DeclaredCard } from "./DeclaredCard";
import { OptionsCard } from "./OptionsCard";

export interface CardRef {
  validate: () => void;
  show: () => void;
}

export interface CardProps {
  /** The card's fields, in order; given, they replace `fields`. */
  children?: React.ReactNode;
  autoFocus?: boolean;
  colorScheme?: ColorScheme;
  theme?: ThemeDefinition;
  icons?: boolean | Partial<CardIcons>;
  translations?: CardTranslations;
  /** @deprecated Declare the fields as the card's children instead. */
  fields?: CardFieldName[];
  onReady?: () => void;
  onError?: () => void;
  onSwipe?: (data: SwipedCard) => void;
  onChange?: (data: CardPayload) => void;
  onComplete?: (data: CardPayload) => void;
  onValidate?: (data: CardPayload) => void;
  /** A map by field is deprecated: give each field its own `autoComplete`. */
  autoComplete?: CardOptions["autoComplete"];
  autoProgress?: boolean;
  acceptedBrands?: CardBrandName[];
  defaultValues?: { name?: string };
  onFocus?: (event: FieldEvent) => void;
  onBlur?: (event: FieldEvent) => void;
  onKeyUp?: (event: FieldEvent) => void;
  onKeyDown?: (event: FieldEvent) => void;
  /** @deprecated Use `<Card.Cvc redact />` instead. */
  redactCVC?: boolean;
  /** @deprecated Use `<Card.Cvc allow3DigitAmex />` instead. */
  allow3DigitAmexCVC?: boolean;
  validation?: CardOptions["validation"];
  customBrands?: CustomBrand[];
  agentTools?: AgentToolsConfig;
  preload?: boolean;
}

export const Card = React.forwardRef<CardRef, CardProps>(function Card(
  props,
  forwardedRef
) {
  // Children that render nothing for a moment must not remount the card.
  if (props.children === undefined) {
    return <OptionsCard {...props} ref={forwardedRef} />;
  }

  return <DeclaredCard {...props} ref={forwardedRef} />;
});
