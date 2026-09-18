import { clean, material, minimal } from "themes";
import type { ThemeDefinition } from "types";

// The themes <ev-card> takes by name.
export const THEMES: Record<string, () => ThemeDefinition> = {
  clean,
  material,
  minimal,
};
