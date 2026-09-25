export function cssVar(name: string): string {
  return window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}
