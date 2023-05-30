type CalculateHeightSettings = {
  height?: string;
  theme?: "minimal" | "material";
};

export default function calculateHeight(settings?: CalculateHeightSettings) {
  if (settings != null) {
    if (settings.height) {
      return settings.height;
    }
    if (settings.theme === "minimal" || settings.theme === "material") {
      return "145px";
    }
  }
  return "180px";
}
