import type { CardField, CardFrameConfig, CardSpecNode } from "types";

// `ui.card()` picks the fields with `fields` and the deprecated `hiddenFields`,
// in a fixed order. The renderer is one rolling deployment loaded by every SDK
// version ever shipped, so this translation can never be removed.
const DEFAULT_FIELDS: CardField[] = ["number", "expiry", "cvc"];
const FIELD_ORDER: CardField[] = ["name", "number", "expiry", "cvc"];

export function isSpec(
  fields: CardFrameConfig["fields"]
): fields is CardSpecNode[] {
  return (
    Array.isArray(fields) && fields.every((field) => typeof field === "object")
  );
}

export function legacyNodes(
  config: Pick<CardFrameConfig, "fields" | "hiddenFields">
): CardSpecNode[] {
  const fields = isSpec(config.fields) ? [] : config.fields ?? DEFAULT_FIELDS;
  const hidden = String(config.hiddenFields ?? "").split(",");

  return FIELD_ORDER.filter(
    (field) => fields.includes(field) && !hidden.includes(field)
  ).map((field) => ({ type: field, id: field, props: {} }));
}
