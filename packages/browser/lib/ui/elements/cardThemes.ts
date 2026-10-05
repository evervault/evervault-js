import { clean, material, minimal } from "themes";

// The themes <ev-card> takes by name.
export const THEMES = {
  clean,
  material,
  minimal,
};

export type ThemeName = keyof typeof THEMES;
