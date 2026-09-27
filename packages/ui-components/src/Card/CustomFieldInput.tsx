import { FocusEvent, HTMLAttributes } from "react";
import type { CustomFieldProps } from "./customField";
import type { CustomFieldInputId } from "./types";

interface CustomFieldInputProps {
  id: CustomFieldInputId;
  field: CustomFieldProps;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

type InputMode = HTMLAttributes<HTMLInputElement>["inputMode"];
type EnterKeyHint = HTMLAttributes<HTMLInputElement>["enterKeyHint"];

export function CustomFieldInput({
  id,
  field,
  value,
  disabled,
  onChange,
  onBlur,
  onFocus,
  onKeyUp,
  onKeyDown,
}: CustomFieldInputProps) {
  return (
    <input
      id={id}
      name={field.name}
      type={field.type}
      value={value}
      disabled={disabled}
      readOnly={field.readOnly}
      placeholder={field.placeholder}
      autoComplete={field.autoComplete}
      inputMode={field.inputMode as InputMode}
      autoCapitalize={field.autoCapitalize}
      spellCheck={field.spellCheck}
      enterKeyHint={field.enterKeyHint as EnterKeyHint}
      maxLength={field.maxLength}
      min={field.min}
      max={field.max}
      step={field.step}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onFocus={onFocus}
      onKeyUp={onKeyUp}
      onKeyDown={onKeyDown}
    />
  );
}
