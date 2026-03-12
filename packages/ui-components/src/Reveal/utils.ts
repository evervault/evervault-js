import { JsonValue, query } from "jsonpath-rfc9535";

const ALLOWED_TYPES = ["string", "number", "boolean"];

export function resolveJSONPath(json: JSON, path: string): string {
  const matches = query(json as unknown as JsonValue, path);
  if (matches.length === 0) {
    throw new Error(`No matches found for path ${path}`);
  }

  const value = matches[0] as unknown;
  if (value === null || value === undefined) return "";

  const type = typeof value;
  if (!ALLOWED_TYPES.includes(type)) {
    throw new Error(`Cannot reveal a value of type ${type}`);
  }

  return String(value);
}
