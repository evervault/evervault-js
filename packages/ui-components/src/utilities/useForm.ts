import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type UseFormReturn<T> = {
  values: T;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: React.Dispatch<React.SetStateAction<T>>;
  errors: Partial<Record<keyof T, string>> | null;
  setError: <K extends keyof T>(field: K, error: string | undefined) => void;
  isValid: boolean;
  validate: () => void;
  register: <K extends keyof T>(
    name: K
  ) => {
    onChange: (value: T[K]) => void;
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  };
};

type UseFormOptions<T> = {
  initialValues: T;
  validate: Record<keyof T, (values: T) => string | undefined>;
  onChange?: (values: UseFormReturn<T>) => void;
};

export function useForm<T extends object>({
  initialValues,
  validate,
  onChange,
}: UseFormOptions<T>): UseFormReturn<T> {
  const validators = useRef(validate);
  const triggerChange = useRef(false);
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<UseFormReturn<T>["errors"]>(
    {} as UseFormReturn<T>["errors"]
  );

  // keep track of latest validation functions in a ref to prevent
  // re-renders when the function changes.
  useEffect(() => {
    validators.current = validate;
  }, [validate]);

  const setError = useCallback(
    <K extends keyof T>(field: K, error: string | undefined) => {
      if (!error) {
        setErrors((prev) => {
          if (!prev) return prev;
          return Object.keys(prev).reduce((acc, key) => {
            if (key === field) return acc;

            return {
              ...acc,
              [key]: prev?.[key as K],
            };
          }, {});
        });
        return;
      }

      setErrors((prev) => ({
        ...prev,
        [field]: error,
      }));

      triggerChange.current = true;
    },
    []
  );

  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      const newValues = {
        ...values,
        [field]: value,
      };

      if (errors?.[field]) {
        setError(field, undefined);
      }

      setValues(newValues);
      triggerChange.current = true;
    },
    [values, errors, setError]
  );

  const isValid = useMemo(() => {
    return Object.keys(errors || {}).length === 0;
  }, [errors]);

  const validateForm = useCallback(() => {
    const nextErrors = Object.keys(values).reduce((acc, key) => {
      const validator = validators.current?.[key as keyof T];
      if (validator) {
        const error = validator(values);
        if (error) {
          return {
            ...acc,
            [key]: error,
          };
        }
      }

      return acc;
    }, {} as Record<keyof T, string>);

    const hasErrors = Object.keys(nextErrors).length > 0;
    setErrors(hasErrors ? nextErrors : null);

    // iterate over the errors and if any of them are different then we should
    // trigger a change event.
    const shouldTriggerChange = Object.keys(nextErrors).some((key) => {
      const prevError = errors?.[key as keyof T];
      const nextError = nextErrors[key as keyof T];
      return prevError !== nextError;
    });

    triggerChange.current = shouldTriggerChange;
  }, [errors, values]);

  const validateField = useCallback(
    <K extends keyof T>(field: K) => {
      const validator = validators.current?.[field];
      if (validator) {
        const error = validator(values);
        setError(field, error);
      }
    },
    [values, setError]
  );

  const register = useCallback(
    <K extends keyof T>(name: K) => {
      const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (e.target.value) {
          validateField(name);
        }
      };

      const handleChange = (value: T[K]) => {
        setValue(name, value);
      };

      return {
        onBlur: handleBlur,
        onChange: handleChange,
      };
    },
    [setValue, validateField]
  );

  const form = useMemo(() => {
    return {
      values,
      setValue,
      errors,
      setError,
      isValid,
      register,
      setValues,
      validate: validateForm,
    };
  }, [values, setValue, errors, setError, isValid, register, validateForm]);

  useEffect(() => {
    if (!triggerChange.current) return;
    triggerChange.current = false;
    onChange?.(form);
  }, [form, onChange]);

  return form;
}
