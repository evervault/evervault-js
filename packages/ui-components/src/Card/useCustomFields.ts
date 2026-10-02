import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  customFieldError,
  declaredCustomFields,
  validationRulesKey,
} from "./customField";
import type { CustomFieldError, CustomFieldProps } from "./customField";
import type { CardSpecNode } from "types";

// Every value the shopper types, and every error shown, is stored together with
// the field's rules at that moment.
// If the merchant's page changes a field's rules after the shopper typed, the
// old value and error are dropped. This is for security: otherwise the page
// could keep changing the pattern to work out what was typed.
interface ValueWithRules<T> {
  value: T;
  validationRulesKey: string | undefined;
}

type ValuesByFieldName<T> = Map<string, ValueWithRules<T>>;

function withRules<T>(
  value: T,
  name: string,
  validationRulesKeys: Map<string, string>
): ValueWithRules<T> {
  return { value, validationRulesKey: validationRulesKeys.get(name) };
}

// The entries whose field still has the rules they were entered under.
function enteredUnderCurrentRules<T>(
  entries: ValuesByFieldName<T>,
  validationRulesKeys: Map<string, string>
): Map<string, T> {
  return new Map(
    [...entries]
      .filter(
        ([name, entry]) =>
          entry.validationRulesKey === validationRulesKeys.get(name)
      )
      .map(([name, entry]) => [name, entry.value])
  );
}

// Drops the entries of fields whose rules have changed, so changing the rules
// back brings nothing back. Fields no longer declared keep theirs.
function withoutChangedRules<T>(
  entries: ValuesByFieldName<T>,
  validationRulesKeys: Map<string, string>
): ValuesByFieldName<T> {
  const kept = [...entries].filter(
    ([name, entry]) =>
      !validationRulesKeys.has(name) ||
      entry.validationRulesKey === validationRulesKeys.get(name)
  );

  return kept.length === entries.size ? entries : new Map(kept);
}

// Fills a field with its defaultValue while it is empty or still holds the
// previous default, so a changed default replaces only an untouched value.
function useDefaultValues(
  fieldsByName: Map<string, CustomFieldProps>,
  currentValues: Map<string, string>,
  validationRulesKeys: Map<string, string>,
  setTypedValues: (
    update: (current: ValuesByFieldName<string>) => ValuesByFieldName<string>
  ) => void
) {
  // The default last filled into each field, by name.
  const filledDefaults = useRef(new Map<string, string>());

  useEffect(() => {
    const defaultsToFill: ValuesByFieldName<string> = new Map();

    fieldsByName.forEach(({ defaultValue }, name) => {
      const previous = filledDefaults.current.get(name);

      // No default declared, or the same one as last time: nothing to fill.
      if (defaultValue === undefined || defaultValue === previous) return;

      filledDefaults.current.set(name, defaultValue);

      const value = currentValues.get(name) ?? "";

      // Only fill a field that's empty or still holds the previous default, so
      // nothing the shopper typed is replaced.
      if (value.length === 0 || value === previous) {
        defaultsToFill.set(
          name,
          withRules(defaultValue, name, validationRulesKeys)
        );
      }
    });

    if (defaultsToFill.size === 0) return;

    // One update for every field, so they re-render together.
    setTypedValues((current) => new Map([...current, ...defaultsToFill]));
  }, [fieldsByName, currentValues, validationRulesKeys, setTypedValues]);
}

export function useCustomFields(nodes: CardSpecNode[], onChange: () => void) {
  const fieldsByName = useMemo(() => declaredCustomFields(nodes), [nodes]);
  const [typedValues, setTypedValues] = useState<ValuesByFieldName<string>>(
    () => new Map()
  );
  const [shownErrors, setShownErrors] = useState<
    ValuesByFieldName<CustomFieldError>
  >(() => new Map());
  // Set when values or errors change, so `onChange` runs once after the render.
  const notifyAfterRender = useRef(false);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const validationRulesKeys = useMemo(
    () =>
      new Map(
        [...fieldsByName].map(([name, field]) => [
          name,
          validationRulesKey(field),
        ])
      ),
    [fieldsByName]
  );

  const currentValues = useMemo(
    () => enteredUnderCurrentRules(typedValues, validationRulesKeys),
    [typedValues, validationRulesKeys]
  );
  const currentErrors = useMemo(
    () => enteredUnderCurrentRules(shownErrors, validationRulesKeys),
    [shownErrors, validationRulesKeys]
  );

  // The error a value would get in its field, if any.
  const errorFor = useCallback(
    (name: string, value: string) => {
      const field = fieldsByName.get(name);
      return field && customFieldError(field, value);
    },
    [fieldsByName]
  );

  // Shows the error under a field, or clears it when there is none.
  const setShownError = useCallback(
    (name: string, error: CustomFieldError | undefined) => {
      if (currentErrors.get(name) === error) return;

      notifyAfterRender.current = true;
      setShownErrors((current) => {
        const next = new Map(current);
        if (error) next.set(name, withRules(error, name, validationRulesKeys));
        else next.delete(name);
        return next;
      });
    },
    [currentErrors, validationRulesKeys]
  );

  const setValue = useCallback(
    (name: string, value: string) => {
      notifyAfterRender.current = true;
      setTypedValues((current) =>
        new Map(current).set(name, withRules(value, name, validationRulesKeys))
      );

      // A field already showing an error is re-checked as the shopper types.
      if (currentErrors.has(name)) setShownError(name, errorFor(name, value));
    },
    [currentErrors, setShownError, errorFor, validationRulesKeys]
  );

  const blur = useCallback(
    (name: string) =>
      setShownError(name, errorFor(name, currentValues.get(name) ?? "")),
    [setShownError, errorFor, currentValues]
  );

  // Checks every field and shows each one's error.
  const validate = useCallback(() => {
    const errors = new Map<string, CustomFieldError>();

    fieldsByName.forEach((field, name) => {
      const error = customFieldError(field, currentValues.get(name) ?? "");
      if (error) errors.set(name, error);
    });

    const differs =
      errors.size !== currentErrors.size ||
      [...errors].some(([name, error]) => currentErrors.get(name) !== error);

    if (differs) notifyAfterRender.current = true;

    setShownErrors(
      new Map(
        [...errors].map(([name, error]) => [
          name,
          withRules(error, name, validationRulesKeys),
        ])
      )
    );
    return errors;
  }, [fieldsByName, currentValues, currentErrors, validationRulesKeys]);

  useEffect(() => {
    setTypedValues((current) =>
      withoutChangedRules(current, validationRulesKeys)
    );
    setShownErrors((current) =>
      withoutChangedRules(current, validationRulesKeys)
    );
  }, [validationRulesKeys]);

  useEffect(() => {
    if (!notifyAfterRender.current) return;

    notifyAfterRender.current = false;
    onChangeRef.current();
  }, [currentValues, currentErrors]);

  useDefaultValues(
    fieldsByName,
    currentValues,
    validationRulesKeys,
    setTypedValues
  );

  const valueOf = useCallback(
    (name: string) => currentValues.get(name) ?? "",
    [currentValues]
  );

  return useMemo(
    () => ({
      declared: fieldsByName,
      values: currentValues,
      errors: currentErrors,
      valueOf,
      setValue,
      blur,
      validate,
    }),
    [
      fieldsByName,
      currentValues,
      currentErrors,
      valueOf,
      setValue,
      blur,
      validate,
    ]
  );
}
