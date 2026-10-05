export function cssVar(name: string): string {
  if (typeof window === "undefined") return "";

  return window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}
