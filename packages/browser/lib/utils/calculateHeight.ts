import type { InputSettings, RevealSettings } from "../types";

export default function calculateHeight(
  settings?: InputSettings | RevealSettings,
  isReveal = false
): string {
  if (settings != null) {
    if (settings.height) {
      return settings.height;
    }
    if (isReveal) {
      return "80px";
    }
    if (settings.theme === "minimal" || settings.theme === "material") {
      return "145px";
    }
  }
  return "180px";
}
