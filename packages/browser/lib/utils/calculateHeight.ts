type CalculateHeightSettings = {
  height?: string;
  theme?: "minimal" | "material";
};

export default function calculateHeight(
  settings?: CalculateHeightSettings,
  isReveal = false
) {
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
