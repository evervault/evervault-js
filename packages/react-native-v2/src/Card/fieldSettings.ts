import { createContext, useContext, useId, useLayoutEffect } from "react";

export type CardInputName = "name" | "number" | "expiry" | "cvc";

// What a card field declares about how its value is judged and reported.
export interface CardFieldSettings {
  errorMessage?: string;
  unsupportedBrandMessage?: string;
  pattern?: string;
  optional?: boolean;
  allow3DigitAmex?: boolean;
}

export type CardSettingsByField = Partial<
  Record<CardInputName, CardFieldSettings>
>;

export interface CardFieldSettingsContextValue {
  register(
    id: string,
    field: CardInputName,
    settings: CardFieldSettings
  ): () => void;
}

export const CardFieldSettingsContext =
  createContext<CardFieldSettingsContextValue>({
    register: () => () => {},
  });

// Each field's settings, from every input writing it: the expiry halves both
// write `expiry`, and the first to declare a setting gives it.
export function settingsByField(
  registered: ReadonlyMap<
    string,
    { field: CardInputName; settings: CardFieldSettings }
  >
): CardSettingsByField {
  const merged: CardSettingsByField = {};

  for (const { field, settings } of registered.values()) {
    const current = merged[field] ?? {};

    for (const [key, value] of Object.entries(settings)) {
      const setting = key as keyof CardFieldSettings;
      if (value !== undefined && current[setting] === undefined) {
        (current as Record<string, unknown>)[setting] = value;
      }
    }

    merged[field] = current;
  }

  return merged;
}

export function useCardFieldSettings(
  field: CardInputName,
  {
    errorMessage,
    unsupportedBrandMessage,
    pattern,
    optional,
    allow3DigitAmex,
  }: CardFieldSettings
) {
  const { register } = useContext(CardFieldSettingsContext);
  const id = useId();

  useLayoutEffect(
    () =>
      register(id, field, {
        errorMessage,
        unsupportedBrandMessage,
        pattern,
        optional,
        allow3DigitAmex,
      }),
    [
      register,
      id,
      field,
      errorMessage,
      unsupportedBrandMessage,
      pattern,
      optional,
      allow3DigitAmex,
    ]
  );
}
