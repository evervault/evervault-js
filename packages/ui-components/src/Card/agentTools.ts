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

export interface CardSubmitResult {
  status: "submitted";
  brand: string | null;
  lastFour: string | null;
}

export interface AgentToolHandlers {
  getStatus: () => CardFormStatus;
  focusField: (field: CardField) => { focused: CardField };
  submit: () => Promise<CardSubmitResult>;
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

export function incompleteFormMessage(
  productName: string,
  invalidFields: CardField[]
): string {
  return `Cannot submit ${productName}: the following fields are missing or invalid: ${invalidFields.join(", ")}. Ask the user to complete them and try again.`;
}

export function fieldNotAvailableMessage(
  productName: string,
  field: string
): string {
  return `${productName} does not show a "${field}" field.`;
}

export function notReadyMessage(productName: string): string {
  return `${productName} is still loading. Try again in a moment.`;
}

export function buildAgentTools(
  config: AgentToolsFrameConfig,
  fields: CardField[],
  handlers: AgentToolHandlers
): ModelContextTool[] {
  const { namePrefix, productName } = config;

  return [
    {
      name: agentToolName(namePrefix, "get-card-form-status"),
      description: `Read the state of ${productName}. Returns, for each card field, whether the user has entered a value and whether it is valid, plus whether the whole form is complete. Never returns card details.`,
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true },
      execute: () => handlers.getStatus(),
    },
    {
      name: agentToolName(namePrefix, "focus-card-field"),
      description: `Move keyboard focus to a field in ${productName} so the user can type into it. Card details must always be entered by the user; this tool cannot fill fields.`,
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
        const field = (input as { field?: unknown } | null)?.field;
        if (typeof field !== "string" || !fields.includes(field as CardField)) {
          throw new Error(fieldNotAvailableMessage(productName, String(field)));
        }
        return handlers.focusField(field as CardField);
      },
    },
    {
      name: agentToolName(namePrefix, "submit-card"),
      description: `Submit the card details the user entered in ${productName} for tokenization. Only succeeds when every field is complete and valid; otherwise it fails and reports which fields still need attention. Returns an opaque confirmation, never card details.`,
      inputSchema: { type: "object", properties: {} },
      annotations: { consequentialHint: true },
      execute: () => handlers.submit(),
    },
  ];
}
