import { createContext, useContext, useId, useLayoutEffect } from "react";
import type { CardFieldSettings } from "shared/cardFieldSettings";

export type CardInputName = "name" | "number" | "expiry" | "cvc";

export type CardSettingsByField = Partial<
  Record<CardInputName, CardFieldSettings>
>;

export interface CardFieldSettingsContextValue {
  set(id: string, field: CardInputName, settings: CardFieldSettings): void;
  remove(id: string): void;
}

export const CardFieldSettingsContext =
  createContext<CardFieldSettingsContextValue>({
    set: () => {},
    remove: () => {},
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
  const { set, remove } = useContext(CardFieldSettingsContext);
  const id = useId();

  // Removed only on unmount, so a changed setting keeps the input's place.
  useLayoutEffect(() => () => remove(id), [remove, id]);

  useLayoutEffect(
    () =>
      set(id, field, {
        errorMessage,
        unsupportedBrandMessage,
        pattern,
        optional,
        allow3DigitAmex,
      }),
    [
      set,
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
