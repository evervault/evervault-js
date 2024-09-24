import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface UseFormReturn<T> {
  values: T;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: React.Dispatch<React.SetStateAction<T>>;
  errors: Partial<Record<keyof T, string>> | null;
  setError: <K extends keyof T>(field: K, error: string | undefined) => void;
  isValid: boolean;
  validate: (cb?: ValidationCallback<T>) => void;
  register: <K extends keyof T>(
    name: K
  ) => {
    onChange: (value: T[K]) => void;
    //TODO(Mark): Replace with union of React.FocusEvent<HTMLInputElement> and native event
    onBlur: (event: any) => void;
  };
}

interface UseFormOptions<T> {
  initialValues: T;
  validate: Record<keyof T, (values: T) => string | undefined>;
  onChange?: (values: UseFormReturn<T>) => void;
}

type ValidationCallback<T> = (form: UseFormReturn<T>) => void;

export function useForm<T extends object>({
  initialValues,
  validate,
  onChange,
}: UseFormOptions<T>): UseFormReturn<T> {
  const validators = useRef(validate);
  const triggerChange = useRef(false);
  const validationCallback = useRef<ValidationCallback<T>>();
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
      const nextValues = { ...values, [field]: value };
      setValues((p) => ({ ...p, [field]: value }));

      const fieldsToValidate: string[] = Object.keys(errors ?? {});
      if (
        field === "number" &&
        errors?.["cvc" as keyof T] == null &&
        nextValues?.["cvc" as keyof T] != null
      ) {
        fieldsToValidate.push("cvc");
      }

      const nextErrors: Partial<Record<keyof T, string>> = {};
      fieldsToValidate.forEach((key) => {
        if (key === field) return;
        const validator = validators.current?.[key as keyof T];
        if (!validator) return;
        const error = validator(nextValues);
        if (!error) return;
        nextErrors[key as keyof T] = error;
      });

      setErrors(nextErrors);

      triggerChange.current = true;
    },
    [values, errors]
  );

  const isValid = useMemo(
    () => Object.keys(errors ?? {}).length === 0,
    [errors]
  );

  const validateForm = useCallback(
    (cb?: ValidationCallback<T>) => {
      validationCallback.current = cb;

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
    },
    [errors, values]
  );

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
      const handleBlur = () => {
        validateField(name);
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

  const form = useMemo(
    () => ({
      values,
      setValue,
      errors,
      setError,
      isValid,
      register,
      setValues,
      validate: validateForm,
    }),
    [values, setValue, errors, setError, isValid, register, validateForm]
  );

  useEffect(() => {
    if (triggerChange.current) {
      triggerChange.current = false;
      onChange?.(form);
    }

    if (validationCallback.current) {
      validationCallback.current(form);
      validationCallback.current = undefined;
    }
  }, [form, onChange]);

  return form;
}
