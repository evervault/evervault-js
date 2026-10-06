export type CardField = "name" | "number" | "expiry" | "cvc";

// The halves of a split expiry.
export type ExpiryHalf = "expiryMonth" | "expiryYear";

export type CardSpecNodeType = "row" | CardField | ExpiryHalf | "field";

export interface CardSpecNode {
  type: CardSpecNodeType;
  id: string;
  props: Record<string, string>;
  children?: CardSpecNode[];
}

export type CardSpecPatchOp =
  | {
      op: "insert";
      parentId: string | null;
      index: number;
      node: CardSpecNode;
    }
  | { op: "remove"; id: string }
  | { op: "update"; id: string; props: Record<string, string> }
  // `index` counts the destination's children after the node has left them.
  | { op: "move"; id: string; parentId: string | null; index: number };
