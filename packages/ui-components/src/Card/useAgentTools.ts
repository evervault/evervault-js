import { useEffect, useRef } from "react";
import { UseFormReturn } from "shared";
import {
  buildAgentTools,
  buildFieldStatuses,
  fieldNotAvailableMessage,
  getFocusedField,
  type CardFormValidators,
} from "./agentTools";
import { cardFieldWrittenBy } from "./useSpec";
import type { CardForm, CardInput } from "./types";
import type { AgentToolsFrameConfig, CardField } from "types";

interface UseAgentToolsParams {
  config: AgentToolsFrameConfig | undefined;
  fields: CardField[];
  inputs: CardInput[];
  form: UseFormReturn<CardForm>;
  validators: CardFormValidators;
  t: (key: string) => string;
  // Agents never see the customer's own fields, but the card waits on them.
  customFieldsComplete: boolean;
}

// Registers WebMCP tools for the card form. Tool handlers read the latest
// form state through refs so registration only happens once per config.
export function useAgentTools({
  config,
  fields,
  inputs,
  form,
  validators,
  t,
  customFieldsComplete,
}: UseAgentToolsParams) {
  const latest = useRef({ form, validators, t, customFieldsComplete });
  latest.current = { form, validators, t, customFieldsComplete };

  const namePrefix = config?.namePrefix;
  const productName = config?.productName;
  const exposeTo = config?.exposeTo.join(",");
  const fieldList = fields.join(",");
  const inputList = inputs.join(",");

  useEffect(() => {
    if (!namePrefix || !productName) return undefined;

    const modelContext = document.modelContext;
    if (!modelContext) {
      console.warn(
        "Agent tools are enabled but this browser does not expose document.modelContext (WebMCP)."
      );
      return undefined;
    }
    if (typeof modelContext.registerTool !== "function") {
      console.warn(
        "Agent tools are enabled but document.modelContext.registerTool is unavailable; the WebMCP build may be too old."
      );
      return undefined;
    }

    const activeFields = fieldList.split(",") as CardField[];
    const activeInputs = inputList.split(",") as CardInput[];
    const exposedTo = exposeTo ? exposeTo.split(",") : [];

    const buildStatus = (values: CardForm) => {
      const { validators, t, customFieldsComplete } = latest.current;
      const statuses = buildFieldStatuses(activeFields, values, validators, t);
      return {
        fields: statuses,
        isComplete:
          customFieldsComplete && statuses.every((status) => status.isValid),
        focusedField: getFocusedField(activeInputs),
      };
    };

    const tools = buildAgentTools(
      { namePrefix, productName, exposeTo: exposedTo },
      activeFields,
      {
        getStatus: () => buildStatus(latest.current.form.values),
        focusField: (field) => {
          const id = activeInputs.find(
            (input) => cardFieldWrittenBy(input) === field
          );
          const input = id && document.getElementById(id);
          if (!(input instanceof HTMLInputElement)) {
            throw new Error(fieldNotAvailableMessage(productName, field));
          }
          input.focus();
          return { focused: field };
        },
        setFieldValue: (field, value) => {
          const { form, validators } = latest.current;
          const nextValues = { ...form.values, [field]: value };
          form.setValue(field, value);
          // Validate straight away, as a blur would after typing.
          form.setError(field, validators[field](nextValues));
          return buildStatus(nextValues);
        },
      }
    );

    const controller = new AbortController();

    for (const tool of tools) {
      Promise.resolve(
        modelContext.registerTool(tool, {
          signal: controller.signal,
          exposedTo,
        })
      ).catch((error: unknown) => {
        console.warn(`Failed to register agent tool "${tool.name}"`, error);
      });
    }

    return () => controller.abort();
  }, [namePrefix, productName, exposeTo, fieldList, inputList]);
}
