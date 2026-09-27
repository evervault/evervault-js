import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  customFieldError,
  customFieldRules,
  declaredCustomFields,
} from "./customField";
import type { CustomFieldError } from "./customField";
import type { CardSpecNode } from "types";

interface Ruled<T> {
  value: T;
  rules: string | undefined;
}

// Only the entries made under their declared field's current rules.
function underRules<T>(
  entries: Map<string, Ruled<T>>,
  rules: Map<string, string>
): Map<string, T> {
  return new Map(
    [...entries]
      .filter(([name, entry]) => entry.rules === rules.get(name))
      .map(([name, entry]) => [name, entry.value])
  );
}

// A value counts only under the rules it was typed under, or rules could probe it.
export function useCustomFields(nodes: CardSpecNode[], onChange: () => void) {
  const declared = useMemo(() => declaredCustomFields(nodes), [nodes]);
  const [entered, setEntered] = useState(
    () => new Map<string, Ruled<string>>()
  );
  const [judged, setJudged] = useState(
    () => new Map<string, Ruled<CustomFieldError>>()
  );
  const changed = useRef(false);
  const latestOnChange = useRef(onChange);

  useEffect(() => {
    latestOnChange.current = onChange;
  });

  const rules = useMemo(
    () =>
      new Map(
        [...declared].map(([name, field]) => [name, customFieldRules(field)])
      ),
    [declared]
  );

  const values = useMemo(() => underRules(entered, rules), [entered, rules]);
  const shown = useMemo(() => underRules(judged, rules), [judged, rules]);

  const check = useCallback(
    (name: string, value: string) => {
      const field = declared.get(name);
      return field && customFieldError(field, value);
    },
    [declared]
  );

  const show = useCallback(
    (name: string, error: CustomFieldError | undefined) => {
      if (shown.get(name) === error) return;

      changed.current = true;
      setJudged((current) => {
        const next = new Map(current);
        if (error) next.set(name, { value: error, rules: rules.get(name) });
        else next.delete(name);
        return next;
      });
    },
    [shown, rules]
  );

  const setValue = useCallback(
    (name: string, value: string) => {
      changed.current = true;
      setEntered((current) =>
        new Map(current).set(name, { value, rules: rules.get(name) })
      );

      if (shown.has(name)) show(name, check(name, value));
    },
    [shown, show, check, rules]
  );

  const blur = useCallback(
    (name: string) => show(name, check(name, values.get(name) ?? "")),
    [show, check, values]
  );

  const validate = useCallback(() => {
    const errors = new Map<string, CustomFieldError>();

    declared.forEach((field, name) => {
      const error = customFieldError(field, values.get(name) ?? "");
      if (error) errors.set(name, error);
    });

    const differs =
      errors.size !== shown.size ||
      [...errors].some(([name, error]) => shown.get(name) !== error);

    if (differs) changed.current = true;

    setJudged(
      new Map(
        [...errors].map(([name, error]) => [
          name,
          { value: error, rules: rules.get(name) },
        ])
      )
    );
    return errors;
  }, [declared, values, shown, rules]);

  // Forgotten once the rules change, so restoring the old rules restores nothing.
  useEffect(() => {
    function current<T>(entries: Map<string, Ruled<T>>) {
      const kept = [...entries].filter(
        ([name, entry]) => !rules.has(name) || entry.rules === rules.get(name)
      );

      return kept.length === entries.size ? entries : new Map(kept);
    }

    setEntered(current);
    setJudged(current);
  }, [rules]);

  useEffect(() => {
    if (!changed.current) return;

    changed.current = false;
    latestOnChange.current();
  }, [values, shown]);

  const applied = useRef(new Map<string, string>());

  // Seeds a field that is empty or still holds the previous default.
  useEffect(() => {
    const seeds = new Map<string, Ruled<string>>();

    declared.forEach(({ defaultValue }, name) => {
      const previous = applied.current.get(name);

      if (defaultValue === undefined || defaultValue === previous) return;

      applied.current.set(name, defaultValue);

      const value = values.get(name) ?? "";

      if (value.length === 0 || value === previous) {
        seeds.set(name, { value: defaultValue, rules: rules.get(name) });
      }
    });

    if (seeds.size === 0) return;

    setEntered((current) => new Map([...current, ...seeds]));
  }, [declared, values, rules]);

  const valueOf = useCallback(
    (name: string) => values.get(name) ?? "",
    [values]
  );

  return useMemo(
    () => ({
      declared,
      values,
      errors: shown,
      valueOf,
      setValue,
      blur,
      validate,
    }),
    [declared, values, shown, valueOf, setValue, blur, validate]
  );
}
