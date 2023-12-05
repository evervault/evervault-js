import { useCallback } from "react";
import { TranslationsObject } from "types";

export function useTranslations(
  translations: TranslationsObject,
  customTranslations: TranslationsObject = {}
) {
  const t = useCallback(
    (key: string): string => {
      const custom = getTranslation(customTranslations, key);
      const value = getTranslation(translations, key);
      return custom ?? value ?? key;
    },
    [customTranslations, translations]
  );

  return { t };
}

function getTranslation(
  translations: TranslationsObject,
  path: string
): string | undefined {
  const keys = path.split(".");
  let value = translations;

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key] as TranslationsObject;
    } else {
      return undefined;
    }
  }

  if (typeof value !== "string") return undefined;

  return value;
}
