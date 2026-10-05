import { THEMES } from "./cardThemes";

// What <ev-card> logs for the developer, shared with the tests that check it.

export function unknownTheme(name: string) {
  return `<ev-card> has no "${name}" theme and will use "clean". Themes are: ${Object.keys(
    THEMES
  ).join(", ")}.`;
}
