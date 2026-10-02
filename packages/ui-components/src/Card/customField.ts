import type { CustomFieldProps } from "shared";

const WORD_START = /(^|\s)(\p{Ll})/gu;
const SENTENCE_START = /(^\s*|[.!?]\s+)(\p{Ll})/gu;

// Browsers capitalise only on virtual keyboards, and never an email or a url.
export function capitalised(field: CustomFieldProps, value: string): string {
  if (field.type !== "text" && field.type !== "tel") return value;

  const upper = (_: string, before: string, letter: string) =>
    before + letter.toUpperCase();

  if (field.autoCapitalize === "characters") return value.toUpperCase();
  if (field.autoCapitalize === "words") return value.replace(WORD_START, upper);
  if (field.autoCapitalize === "sentences") {
    return value.replace(SENTENCE_START, upper);
  }

  return value;
}
