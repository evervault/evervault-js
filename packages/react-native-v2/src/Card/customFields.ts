import { createContext } from "react";

export interface CustomFieldRules {
  required?: boolean;
  minLength?: number;
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

export const CUSTOM_FIELD_ERRORS = {
  required: "This field is required",
  invalid: "Please enter a valid value",
};

// Anchored as in HTML; engines without the `v` flag fall back to `u`.
function compilePattern(source: string | undefined): RegExp | undefined {
  if (source === undefined) return undefined;

  for (const flags of ["v", "u"]) {
    try {
      return new RegExp(`^(?:${source})$`, flags);
    } catch {
      continue;
    }
  }

  return undefined;
}

// Why a value breaks its field's rules, or null when it keeps them. An empty
// optional field keeps them.
export function customFieldError(
  value: string,
  rules: CustomFieldRules
): string | null {
  if (value.length === 0) {
    return rules.required
      ? rules.errorMessage ?? CUSTOM_FIELD_ERRORS.required
      : null;
  }

  const pattern = compilePattern(rules.pattern);

  const invalid =
    (rules.minLength !== undefined && value.length < rules.minLength) ||
    (rules.maxLength !== undefined && value.length > rules.maxLength) ||
    (pattern !== undefined && !pattern.test(value));

  return invalid ? rules.errorMessage ?? CUSTOM_FIELD_ERRORS.invalid : null;
}
