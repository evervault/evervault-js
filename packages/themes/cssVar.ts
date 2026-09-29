/**
 * Reads a CSS custom property from the page's root element (`<html>`), so it
 * has to be declared on `:root`. A variable set on `body` or another element
 * is not seen. Returns an empty string if it isn't set or there is no window.
 */
export function cssVar(name: string): string {
  if (typeof window === "undefined") return "";

  return window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}
