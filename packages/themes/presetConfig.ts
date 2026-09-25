import type { ThemeStyles } from "types";

export interface PresetConfig {
  primary?: string;
  greyTone?: string;
  roundness?: string;
  font?: string;
  selectors?: ThemeStyles;
}

export function withPresetConfig(
  styles: ThemeStyles,
  config?: PresetConfig
): ThemeStyles {
  if (!config) return styles;

  const { primary, greyTone, roundness, font, selectors } = config;

  return {
    ...styles,
    ...(selectors ?? {}),
    ":root": {
      ...(styles[":root"] as Record<string, string> | undefined),
      ...(primary ? { "--ev-color-primary": primary } : {}),
      ...(greyTone ? { "--ev-grey-tone": greyTone } : {}),
      ...(roundness ? { "--ev-roundness": roundness } : {}),
      ...(font ? { "--ev-font-family": font } : {}),
      ...((selectors?.[":root"] as Record<string, string> | undefined) ?? {}),
    },
  };
}
