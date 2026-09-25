import { useEffect, useRef } from "react";
import { UseFormReturn } from "shared";
import {
  buildAgentTools,
  buildFieldStatuses,
  fieldNotAvailableMessage,
  getFocusedField,
  type CardFormValidators,
} from "./agentTools";
import type { CardForm } from "./types";
import type { AgentToolsFrameConfig, CardField } from "types";

interface UseAgentToolsParams {
  config: AgentToolsFrameConfig | undefined;
  fields: CardField[];
  form: UseFormReturn<CardForm>;
  validators: CardFormValidators;
  t: (key: string) => string;
}

// Registers WebMCP tools for the card form. Tool handlers read the latest
// form state through refs so registration only happens once per config.
export function useAgentTools({
  config,
  fields,
  form,
  validators,
  t,
}: UseAgentToolsParams) {
  const latest = useRef({ form, validators, t });
  latest.current = { form, validators, t };

  const namePrefix = config?.namePrefix;
  const productName = config?.productName;
  const exposeTo = config?.exposeTo.join(",");
  const fieldList = fields.join(",");

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
    const exposedTo = exposeTo ? exposeTo.split(",") : [];

    const buildStatus = (values: CardForm) => {
      const { validators, t } = latest.current;
      const statuses = buildFieldStatuses(activeFields, values, validators, t);
      return {
        fields: statuses,
        isComplete: statuses.every((status) => status.isValid),
        focusedField: getFocusedField(activeFields),
      };
    };

    const tools = buildAgentTools(
      { namePrefix, productName, exposeTo: exposedTo },
      activeFields,
      {
        getStatus: () => buildStatus(latest.current.form.values),
        focusField: (field) => {
          const input = document.getElementById(field);
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
  }, [namePrefix, productName, exposeTo, fieldList]);
}
