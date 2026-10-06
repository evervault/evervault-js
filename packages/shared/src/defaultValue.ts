// A value the shopper hasn't changed, which a new default may replace: empty,
// or still the default last filled in.
export function canFillDefault(
  value: string,
  previousDefault: string | undefined
): boolean {
  return value.length === 0 || value === previousDefault;
}
