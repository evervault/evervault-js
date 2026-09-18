import type { CardField, CardSpecNode } from "types";
import { fieldFor } from "./useSpec";

export interface FieldProps {
  label?: string;
  placeholder?: string;
  tooltip?: string;
  iconPosition?: string;
  defaultValue?: string;
  autoComplete?: boolean;
  autoFocus?: boolean;
  redact?: boolean;
  optional?: boolean;
}

interface Attribute {
  prop: keyof FieldProps;
  read?: (value: string) => boolean;
}

// Declaring the attribute is what turns it on; only an explicit denial is false.
function flag(value: string, ...denials: string[]) {
  return !["false", ...denials].includes(value.trim().toLowerCase());
}

const COMMON: Record<string, Attribute> = {
  label: { prop: "label" },
  placeholder: { prop: "placeholder" },
  tooltip: { prop: "tooltip" },
  autocomplete: { prop: "autoComplete", read: (value) => flag(value, "off") },
  autofocus: { prop: "autoFocus", read: flag },
};

const PER_TYPE: Partial<
  Record<CardSpecNode["type"], Record<string, Attribute>>
> = {
  name: { "default-value": { prop: "defaultValue" } },
  number: { "icon-position": { prop: "iconPosition" } },
  cvc: {
    redact: { prop: "redact", read: flag },
    optional: { prop: "optional", read: flag },
  },
};

export function fieldProps(node: CardSpecNode): FieldProps {
  const attributes = { ...COMMON, ...PER_TYPE[node.type] };

  return Object.fromEntries(
    Object.entries(attributes)
      .filter(([attribute]) => attribute in node.props)
      .map(([attribute, { prop, read }]) => {
        const value = node.props[attribute];
        return [prop, read ? read(value) : value];
      })
  ) as FieldProps;
}

// The node claiming each field, in declared order: the first of a type wins.
export function declaredProps(
  nodes: CardSpecNode[]
): Map<CardField, FieldProps> {
  const declared = new Map<CardField, FieldProps>();

  const walk = (node: CardSpecNode) => {
    if (node.type === "row") {
      (node.children ?? []).forEach(walk);
      return;
    }

    const field = fieldFor(node.type);

    if (!field || declared.has(field)) return;

    declared.set(field, fieldProps(node));
  };

  nodes.forEach(walk);

  return declared;
}
