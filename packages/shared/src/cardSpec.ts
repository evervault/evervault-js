import type { CardField, CardSpecNode } from "types";

export type CustomFieldInputId = `field-${string}`;

// The inputs a card can render: the fields, the two halves of a split expiry,
// which write the one expiry between them, and the customer's own fields.
export type CardInput =
  | CardField
  | "expiry-month"
  | "expiry-year"
  | CustomFieldInputId;

const CUSTOM_FIELD_PREFIX = "field-";

export function customFieldInputId(name: string): CustomFieldInputId {
  return `${CUSTOM_FIELD_PREFIX}${name}`;
}

export function isCustomFieldInput(
  input: CardInput
): input is CustomFieldInputId {
  return input.startsWith(CUSTOM_FIELD_PREFIX);
}

// The input a node renders: a field its own, each half of a split expiry one
// of the two that write the expiry. An <ev-field> without a name renders none.
export function inputFor(node: CardSpecNode): CardInput | null {
  const { type } = node;

  if (type === "row") return null;
  if (type === "field") {
    return node.props.name ? customFieldInputId(node.props.name) : null;
  }
  if (type === "expiryMonth") return "expiry-month";
  if (type === "expiryYear") return "expiry-year";
  return type;
}

// Nodes the card leaves out: inputs already claimed earlier in the tree (the
// first wins), and <ev-field>s without a name.
export function skippedNodes(nodes: CardSpecNode[]): CardSpecNode[] {
  const rendered = new Set<CardInput>();

  const walk = (node: CardSpecNode): CardSpecNode[] => {
    if (node.type === "row") return (node.children ?? []).flatMap(walk);

    const input = inputFor(node);

    if (!input || rendered.has(input)) return [node];

    rendered.add(input);
    return [];
  };

  return nodes.flatMap(walk);
}
