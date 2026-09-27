import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { declaredCustomFields } from "./customField";
import type { CardSpecNode } from "types";

// A value outlives its field leaving the tree, so declaring it again brings it back.
// `onChange` hears of each value the customer enters, once it has rendered.
export function useCustomFields(nodes: CardSpecNode[], onChange: () => void) {
  const declared = useMemo(() => declaredCustomFields(nodes), [nodes]);
  const [values, setValues] = useState(() => new Map<string, string>());
  const changed = useRef(false);
  const latestOnChange = useRef(onChange);

  useEffect(() => {
    latestOnChange.current = onChange;
  });

  const setValue = useCallback((name: string, value: string) => {
    changed.current = true;
    setValues((current) => new Map(current).set(name, value));
  }, []);

  useEffect(() => {
    if (!changed.current) return;

    changed.current = false;
    latestOnChange.current();
  }, [values]);

  const applied = useRef(new Map<string, string>());

  // Seeds a field that is empty or still holds the previous default.
  useEffect(() => {
    const seeds = new Map<string, string>();

    declared.forEach(({ defaultValue }, name) => {
      const previous = applied.current.get(name);

      if (defaultValue === undefined || defaultValue === previous) return;

      applied.current.set(name, defaultValue);

      const value = values.get(name) ?? "";

      if (value.length === 0 || value === previous) {
        seeds.set(name, defaultValue);
      }
    });

    if (seeds.size === 0) return;

    setValues((current) => new Map([...current, ...seeds]));
  }, [declared, values]);

  const valueOf = useCallback(
    (name: string) => values.get(name) ?? "",
    [values]
  );

  return useMemo(
    () => ({ declared, values, valueOf, setValue }),
    [declared, values, valueOf, setValue]
  );
}
