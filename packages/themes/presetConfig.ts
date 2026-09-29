import type { ThemeDefinition, ThemeStyles } from "types";

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

// A preset's first argument is either a theme to extend or the config itself.
// ThemeObject only has styles/fonts/fontFaces and PresetConfig never does, so
// the shape tells them apart. Callers index the result instead of destructuring
// it, because api-extractor crashes on that when bundling the @evervault/js types.
export function splitPresetArgs(
  first?: ThemeDefinition | PresetConfig,
  second?: PresetConfig
): [ThemeDefinition | undefined, PresetConfig | undefined] {
  const isTheme =
    typeof first === "function" ||
    (first !== undefined &&
      ("styles" in first || "fonts" in first || "fontFaces" in first));

  return isTheme || first === undefined
    ? [first as ThemeDefinition | undefined, second]
    : [undefined, first as PresetConfig];
}
