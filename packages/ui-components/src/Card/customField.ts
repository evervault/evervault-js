import { compilePattern, isCustomFieldType } from "shared";
import type { CustomFieldProps } from "shared";
import { invalidPattern, unsupportedFieldType } from "./developerMessages";
import type { CardSpecNode } from "types";

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

// Why an <ev-field> behaves differently from its declaration, if it does.
export function customFieldWarnings(node: CardSpecNode): string[] {
  const { name, type, pattern } = node.props;
  const warnings: string[] = [];

  if (type !== undefined && !isCustomFieldType(type.trim().toLowerCase())) {
    warnings.push(unsupportedFieldType(name, type));
  }

  if (pattern !== undefined && !compilePattern(pattern)) {
    warnings.push(invalidPattern(name, pattern));
  }

  return warnings;
}
