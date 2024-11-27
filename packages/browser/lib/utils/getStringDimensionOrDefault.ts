export default function getStringDimensionOrDefault(
  input: string | number | undefined,
  defaultValue: string
): string {
  if (typeof input === "number") {
    return `${input}px`;
  }
  if (typeof input === "string") {
    return input;
  }
  return defaultValue;
}
