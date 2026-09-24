import type { CardForm } from "./types";
import type { AgentToolsFrameConfig, CardField } from "types";

export type CardFormValidators = Record<
  keyof CardForm,
  (values: CardForm) => string | undefined
>;

// Deliberately excludes the field value: agents only ever see whether a
// field is filled and whether it validates.
export interface CardFieldStatus {
  field: CardField;
  hasValue: boolean;
  isValid: boolean;
  error: string | null;
  errorMessage: string | null;
}

export interface CardFormStatus {
  fields: CardFieldStatus[];
  isComplete: boolean;
  focusedField: CardField | null;
}

export interface AgentToolHandlers {
  getStatus: () => CardFormStatus;
  focusField: (field: CardField) => { focused: CardField };
  setFieldValue: (field: CardField, value: string) => CardFormStatus;
}

export function agentToolName(prefix: string, suffix: string): string {
  return `${prefix}-${suffix}`;
}

export function buildFieldStatuses(
  fields: CardField[],
  values: CardForm,
  validators: CardFormValidators,
  t: (key: string) => string
): CardFieldStatus[] {
  return fields.map((field) => {
    const error = validators[field](values) ?? null;
    return {
      field,
      hasValue: values[field].length > 0,
      isValid: error === null,
      error,
      errorMessage: error ? t(`${field}.errors.${error}`) : null,
    };
  });
}

export function getFocusedField(fields: CardField[]): CardField | null {
  const id = document.activeElement?.id;
  return fields.find((field) => field === id) ?? null;
}

// Mirrors what the input masks keep when the value is typed, so the form
// receives the same shape it does from a human.
export function normalizeFieldValue(field: CardField, value: string): string {
  if (field === "name") return value.trim();

  const digits = value.replace(/\D/g, "");
  if (field === "expiry" && digits.length === 6) {
    return digits.slice(0, 2) + digits.slice(4);
  }
  return digits;
}

export function fieldNotAvailableMessage(
  productName: string,
  field: string
): string {
  return `${productName} does not show a "${field}" field.`;
}

export function invalidValueMessage(
  productName: string,
  field: CardField
): string {
  return `${productName} expects a string value for the "${field}" field.`;
}

function assertField(
  productName: string,
  fields: CardField[],
  field: unknown
): CardField {
  if (typeof field !== "string" || !fields.includes(field as CardField)) {
    throw new Error(fieldNotAvailableMessage(productName, String(field)));
  }
  return field as CardField;
}

export function buildAgentTools(
  config: AgentToolsFrameConfig,
  fields: CardField[],
  handlers: AgentToolHandlers
): ModelContextTool[] {
  const { namePrefix, productName } = config;

  return [
    {
      name: agentToolName(namePrefix, "get-form-status"),
      description: `Read the state of ${productName}. Returns, for each card field, whether the user has entered a value and whether it is valid, plus whether the whole form is complete. Never returns card details.`,
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true },
      execute: () => handlers.getStatus(),
    },
    {
      name: agentToolName(namePrefix, "focus-field"),
      description: `Move keyboard focus to a field in ${productName} so the user can type into it.`,
      inputSchema: {
        type: "object",
        properties: {
          field: {
            type: "string",
            enum: fields,
            description: "The card field to focus.",
          },
        },
        required: ["field"],
      },
      execute: (input) => {
        const field = assertField(
          productName,
          fields,
          (input as { field?: unknown } | null)?.field
        );
        return handlers.focusField(field);
      },
    },
    {
      name: agentToolName(namePrefix, "set-field-value"),
      description: `Enter a value into a field in ${productName}, exactly as if the user had typed it. The field is validated immediately. Card number and CVC are digits; expiry is MM/YY. Returns the updated form status, never the value.`,
      inputSchema: {
        type: "object",
        properties: {
          field: {
            type: "string",
            enum: fields,
            description: "The card field to fill.",
          },
          value: {
            type: "string",
            description:
              "The value to enter. Formatting characters such as spaces and slashes are ignored.",
          },
        },
        required: ["field", "value"],
      },
      execute: (input) => {
        const { field: rawField, value } =
          (input as { field?: unknown; value?: unknown } | null) ?? {};
        const field = assertField(productName, fields, rawField);
        if (typeof value !== "string") {
          throw new Error(invalidValueMessage(productName, field));
        }
        return handlers.setFieldValue(field, normalizeFieldValue(field, value));
      },
    },
  ];
}
