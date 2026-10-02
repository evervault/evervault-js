import { createContext } from "react";
import {
  CUSTOM_FIELD_ERRORS,
  compilePattern,
  customFieldError,
} from "shared/customField";
import type { CustomFieldRules as CheckedRules } from "shared/customField";

export interface CustomFieldRules {
  required?: boolean;
  minLength?: number;
  /**
   * The longest value the field takes. Auto-advance moves on once the field
   * holds this many characters.
   */
  maxLength?: number;
  pattern?: string;
  errorMessage?: string;
}

export interface DeclaredCustomField {
  name: string;
  rules: CustomFieldRules;
}

export interface CustomFieldsContextValue {
  set(id: string, name: string, rules: CustomFieldRules): void;
  remove(id: string): void;
}

export const CustomFieldsContext = createContext<CustomFieldsContextValue>({
  set: () => {},
  remove: () => {},
});

// Each name's rules, from the first field declaring it, as `<ev-field>` takes them.
export function rulesByName(
  declared: ReadonlyMap<string, DeclaredCustomField>
): Map<string, CustomFieldRules> {
  const byName = new Map<string, CustomFieldRules>();

  for (const { name, rules } of declared.values()) {
    if (!byName.has(name)) byName.set(name, rules);
  }

  return byName;
}

// The rules as the shared checks take them, with the pattern compiled.
export function checkedRules({
  pattern,
  ...rules
}: CustomFieldRules): CheckedRules {
  return {
    ...rules,
    pattern: pattern === undefined ? undefined : compilePattern(pattern),
  };
}

// Why a value breaks its field's rules, or null when it keeps them.
export function customFieldMessage(
  value: string,
  rules: CustomFieldRules
): string | null {
  const error = customFieldError(checkedRules(rules), value);

  return error ? rules.errorMessage ?? CUSTOM_FIELD_ERRORS[error] : null;
}
