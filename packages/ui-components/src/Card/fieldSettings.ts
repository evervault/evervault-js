import { customFieldInputId, isCustomFieldInput } from "shared";
import type { CardConfig, CardInput } from "./types";
import type { CardFieldMap, CardSpecNode } from "types";

type CardFieldKey = Exclude<keyof CardFieldMap<unknown>, "fields">;

// Each input's own key first, then the key it shares.
const KEYS: Partial<Record<CardInput, CardFieldKey[]>> = {
  name: ["name"],
  number: ["number"],
  expiry: ["expiry"],
  "expiry-month": ["expiryMonth", "expiry"],
  "expiry-year": ["expiryYear", "expiry"],
  cvc: ["cvc"],
};

const CUSTOM_FIELD_PREFIX = "field-".length;

// A card-level on/off setting as it applies to one input, or undefined when
// the card leaves that input to its default.
export function settingForInput(
  setting: boolean | CardFieldMap<boolean> | undefined,
  input: CardInput
): boolean | undefined {
  if (typeof setting !== "object") return setting;

  if (isCustomFieldInput(input)) {
    const { fields } = setting;
    return typeof fields === "object"
      ? fields[input.slice(CUSTOM_FIELD_PREFIX)]
      : fields;
  }

  for (const key of KEYS[input] ?? []) {
    if (setting[key] !== undefined) return setting[key];
  }

  return undefined;
}

function attribute(value: boolean | number | string | undefined) {
  if (value === undefined) return undefined;
  if (value === true) return "";
  return String(value);
}

// The attributes an <ev-field> takes from the card's settings for it.
function customFieldSettings(name: string, config: CardConfig) {
  const input = customFieldInputId(name);
  const translations = config.translations?.fields?.[name];
  const validation = config.validation?.fields?.[name];

  return {
    label: translations?.label,
    placeholder: translations?.placeholder,
    defaultvalue: config.defaultValues?.fields?.[name],
    autocomplete: attribute(settingForInput(config.autoComplete, input)),
    autoprogress: attribute(settingForInput(config.autoProgress, input)),
    required: attribute(validation?.required),
    pattern: validation?.pattern,
    minlength: attribute(validation?.minLength),
    maxlength: attribute(validation?.maxLength),
    min: validation?.min,
    max: validation?.max,
    step: validation?.step,
  };
}

// Each <ev-field> with the card's settings for it filled in where it declares
// none: a field's own attribute wins. Untouched nodes keep their identity.
export function applyCardSettingsToFields(
  nodes: CardSpecNode[],
  config: CardConfig
): CardSpecNode[] {
  let changed = false;

  const next = nodes.map((node) => {
    if (node.type === "row") {
      const children = node.children ?? [];
      const settled = applyCardSettingsToFields(children, config);
      if (settled === children) return node;

      changed = true;
      return { ...node, children: settled };
    }

    if (node.type !== "field" || !node.props.name) return node;

    const settings = Object.entries(
      customFieldSettings(node.props.name, config)
    ).filter(
      (entry): entry is [string, string] =>
        entry[1] !== undefined && !(entry[0] in node.props)
    );

    if (settings.length === 0) return node;

    changed = true;
    return {
      ...node,
      props: { ...Object.fromEntries(settings), ...node.props },
    };
  });

  return changed ? next : nodes;
}
