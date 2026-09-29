import type { ThemeStyles } from "types";

export interface PresetConfig {
  primary?: string;
  greyTone?: string;
  roundness?: string;
  font?: string;
  selectors?: ThemeStyles;
}

const SEMANTIC_VARS = {
  primary: "--ev-color-primary",
  greyTone: "--ev-grey-tone",
  roundness: "--ev-roundness",
  font: "--ev-font-family",
} as const;

export function withPresetConfig(
  styles: ThemeStyles,
  config?: PresetConfig
): ThemeStyles {
  if (!config) return styles;

  const { selectors } = config;
  const root = { ...(styles[":root"] as Record<string, string> | undefined) };

  for (const [key, prop] of Object.entries(SEMANTIC_VARS)) {
    const value = config[key as keyof typeof SEMANTIC_VARS];
    if (value) root[prop] = value;
  }

  return {
    ...styles,
    ...(selectors ?? {}),
    ":root": {
      ...root,
      ...((selectors?.[":root"] as Record<string, string> | undefined) ?? {}),
    },
  };
}
