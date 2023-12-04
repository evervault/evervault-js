import { useLayoutEffect, useMemo, useRef } from "react";

type FieldProps = {
  name?: string;
  hasValue?: boolean;
  error?: false | string;
  children: React.ReactNode;
};

export function Field({ name, error, children, hasValue }: FieldProps) {
  const ref = useRef<HTMLDivElement>(null);

  const isValid = useMemo(() => !error, [error]);

  useLayoutEffect(() => {
    if (!ref.current) return;

    const inputs = ref.current.querySelectorAll("input");
    inputs.forEach((input) => {
      input.setAttribute("aria-invalid", isValid ? "false" : "true");
      input.setCustomValidity(error || "");
    });
  }, [error, isValid]);

  return (
    <div
      ref={ref}
      ev-name={name}
      ev-valid={isValid ? "true" : "false"}
      ev-has-value={String(hasValue)}
      aria-invalid={!isValid}
      className="field"
    >
      {children}
    </div>
  );
}
