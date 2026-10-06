import type { CardSpecNode } from "types/cardSpec";

// The field types a card tree declares, in order, with rows flattened.
export function fieldTypes(nodes: CardSpecNode[]): CardSpecNode["type"][] {
  return nodes.flatMap((node) =>
    node.type === "row" ? fieldTypes(node.children ?? []) : [node.type]
  );
}
