import jsonpath from "jsonpath";

const ALLOWED_TYPES = ["string", "number", "boolean"];

export function resolveJSONPath(json: JSON, path: string): string {
  const matches = jsonpath.query(json, path);
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
