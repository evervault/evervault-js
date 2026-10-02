import type { CardSpecNode } from "types";

export function node(
  type: CardSpecNode["type"],
  id: string = type,
  props: Record<string, string> = {}
): CardSpecNode {
  return { type, id, props };
}

export function row(id: string, children: CardSpecNode[]): CardSpecNode {
  return { type: "row", id, props: {}, children };
}
