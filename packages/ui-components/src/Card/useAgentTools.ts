import { PromisifiedEvervaultClient } from "@evervault/react";
import { useEffect, useRef } from "react";
import { UseFormReturn } from "shared";
import {
  buildAgentTools,
  buildFieldStatuses,
  fieldNotAvailableMessage,
  getFocusedField,
  incompleteFormMessage,
  notReadyMessage,
  type CardFormValidators,
} from "./agentTools";
import { changePayload } from "./utilities";
import type { CardForm } from "./types";
import type {
  AgentToolsFrameConfig,
  CardField,
  CardPayload,
  CustomBrand,
} from "types";

interface UseAgentToolsParams {
  config: AgentToolsFrameConfig | undefined;
  fields: CardField[];
  form: UseFormReturn<CardForm>;
  validators: CardFormValidators;
  ev: PromisifiedEvervaultClient | null;
  payloadOptions: {
    allow3DigitAmexCVC?: boolean;
    cvcOptional?: boolean;
    customBrands?: CustomBrand[];
  };
  t: (key: string) => string;
  onSubmit: (payload: CardPayload) => void;
}

// Registers WebMCP tools for the card form. Tool handlers read the latest
// form state through refs so registration only happens once per config.
export function useAgentTools({
  config,
  fields,
  form,
  validators,
  ev,
  payloadOptions,
  t,
  onSubmit,
}: UseAgentToolsParams) {
  const latest = useRef({ form, validators, ev, payloadOptions, t, onSubmit });
  latest.current = { form, validators, ev, payloadOptions, t, onSubmit };

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

    const tools = buildAgentTools(
      { namePrefix, productName, exposeTo: exposedTo },
      activeFields,
      {
        getStatus: () => {
          const { form, validators, t } = latest.current;
          const statuses = buildFieldStatuses(
            activeFields,
            form.values,
            validators,
            t
          );
          return {
            fields: statuses,
            isComplete: statuses.every((status) => status.isValid),
            focusedField: getFocusedField(activeFields),
          };
        },
        focusField: (field) => {
          const input = document.getElementById(field);
          if (!(input instanceof HTMLInputElement)) {
            throw new Error(fieldNotAvailableMessage(productName, field));
          }
          input.focus();
          return { focused: field };
        },
        submit: async () => {
          const { form, validators, ev, payloadOptions, t, onSubmit } =
            latest.current;
          if (!ev) throw new Error(notReadyMessage(productName));

          const invalid = buildFieldStatuses(
            activeFields,
            form.values,
            validators,
            t
          )
            .filter((status) => !status.isValid)
            .map((status) => status.field);

          if (invalid.length > 0) {
            // Surface validation errors in the UI so the user sees why the
            // agent's submission was rejected.
            form.validate();
            throw new Error(incompleteFormMessage(productName, invalid));
          }

          const payload = await changePayload(
            ev,
            form,
            activeFields,
            payloadOptions
          );

          if (!payload.isComplete) {
            throw new Error(incompleteFormMessage(productName, activeFields));
          }

          onSubmit(payload);

          return {
            status: "submitted" as const,
            brand: payload.card.brand,
            lastFour: payload.card.lastFour,
          };
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
