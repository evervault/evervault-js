import type { CardSpecNode, CardSpecPatchOp } from "types";

type InsertOp = Extract<CardSpecPatchOp, { op: "insert" }>;
type MoveOp = Extract<CardSpecPatchOp, { op: "move" }>;

// Only the containers on the path to a change are rebuilt, so every other node
// keeps the identity that keeps its field mounted.
function withChildren(
  spec: CardSpecNode[],
  apply: (children: CardSpecNode[], parent: CardSpecNode) => CardSpecNode[]
): CardSpecNode[] {
  let touched = false;

  const next = spec.map((node) => {
    if (!node.children) return node;

    const children = apply(node.children, node);

    if (children === node.children) return node;

    touched = true;
    return { ...node, children };
  });

  return touched ? next : spec;
}

function find(spec: CardSpecNode[], id: string): CardSpecNode | undefined {
  for (const node of spec) {
    if (node.id === id) return node;

    const found = node.children && find(node.children, id);

    if (found) return found;
  }

  return undefined;
}

function detach(spec: CardSpecNode[], id: string): CardSpecNode[] {
  if (spec.some((node) => node.id === id)) {
    return spec.filter((node) => node.id !== id);
  }

  return withChildren(spec, (children) => detach(children, id));
}

function place(
  spec: CardSpecNode[],
  node: CardSpecNode,
  op: InsertOp | MoveOp
): CardSpecNode[] {
  if (op.parentId === null) {
    const next = [...spec];
    next.splice(op.index, 0, node);
    return next;
  }

  return withChildren(spec, (children, parent) => {
    if (parent.id !== op.parentId) return place(children, node, op);

    const next = [...children];
    next.splice(op.index, 0, node);
    return next;
  });
}

function update(
  spec: CardSpecNode[],
  id: string,
  props: Record<string, string>
): CardSpecNode[] {
  if (spec.some((node) => node.id === id)) {
    return spec.map((node) => (node.id === id ? { ...node, props } : node));
  }

  return withChildren(spec, (children) => update(children, id, props));
}

function applyOp(spec: CardSpecNode[], op: CardSpecPatchOp): CardSpecNode[] {
  if (op.op === "insert") return place(spec, op.node, op);
  if (op.op === "remove") return detach(spec, op.id);
  if (op.op === "update") return update(spec, op.id, op.props);

  const node = find(spec, op.id);

  if (!node) return spec;

  const remaining = detach(spec, op.id);

  // Looked up after the detach, so a row cannot be moved inside its own subtree.
  if (op.parentId !== null && !find(remaining, op.parentId)) return spec;

  return place(remaining, node, op);
}

// Patching by id keeps untouched nodes mounted, preserving values already typed.
export function applyPatch(
  spec: CardSpecNode[],
  ops: CardSpecPatchOp[]
): CardSpecNode[] {
  return ops.reduce(applyOp, spec);
}
