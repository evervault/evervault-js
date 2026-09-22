import type { CardSpecNode, CardSpecPatchOp } from "types";

type InsertOp = Extract<CardSpecPatchOp, { op: "insert" }>;
type MoveOp = Extract<CardSpecPatchOp, { op: "move" }>;

function sameProps(a: Record<string, string>, b: Record<string, string>) {
  const keys = Object.keys(a);

  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => a[key] === b[key])
  );
}

interface Placement {
  node: CardSpecNode;
  parentId: string | null;
}

interface Plan {
  before: Map<string, Placement>;
  after: Map<string, Placement>;
  // The containers as they stand once the ops emitted so far have been applied.
  containers: Map<string | null, string[]>;
  parents: Map<string, string | null>;
  ops: CardSpecPatchOp[];
}

function placements(
  spec: CardSpecNode[],
  parentId: string | null,
  into: Map<string, Placement>
) {
  for (const node of spec) {
    into.set(node.id, { node, parentId });

    if (node.children) placements(node.children, node.id, into);
  }

  return into;
}

function track(spec: CardSpecNode[], parentId: string | null, plan: Plan) {
  plan.containers.set(
    parentId,
    spec.map((node) => node.id)
  );

  for (const node of spec) {
    plan.parents.set(node.id, parentId);

    if (node.type === "row") track(node.children ?? [], node.id, plan);
  }
}

function detach(plan: Plan, id: string) {
  const siblings = plan.containers.get(plan.parents.get(id) ?? null) ?? [];

  siblings.splice(siblings.indexOf(id), 1);
}

function attach(plan: Plan, node: CardSpecNode, op: InsertOp | MoveOp) {
  const siblings = plan.containers.get(op.parentId) ?? [];

  siblings.splice(op.index, 0, node.id);
  plan.parents.set(node.id, op.parentId);

  if (op.op === "insert" && node.type === "row") {
    track(node.children ?? [], node.id, plan);
  }
}

// An existing descendant is moved into the new node rather than recreated in it.
function insertion(node: CardSpecNode, plan: Plan): CardSpecNode {
  if (!node.children) return node;

  return {
    ...node,
    children: node.children
      .filter((child) => !plan.before.has(child.id))
      .map((child) => insertion(child, plan)),
  };
}

function reconcile(next: CardSpecNode[], parentId: string | null, plan: Plan) {
  next.forEach((node, position) => {
    const before = plan.before.get(node.id);

    if (before && !sameProps(before.node.props, node.props)) {
      plan.ops.push({ op: "update", id: node.id, props: node.props });
    }

    const siblings = plan.containers.get(parentId) ?? [];
    const staying = siblings.filter(
      (id) => plan.after.get(id)?.parentId === parentId
    );

    if (staying[position] !== node.id) {
      // The nodes on their way out are still in place, so the index counts them.
      const index =
        position < staying.length
          ? siblings.indexOf(staying[position])
          : siblings.length;

      if (before) {
        const op: MoveOp = { op: "move", id: node.id, parentId, index };
        plan.ops.push(op);
        detach(plan, node.id);
        attach(plan, node, op);
      } else {
        const op: InsertOp = {
          op: "insert",
          parentId,
          index,
          node: insertion(node, plan),
        };
        plan.ops.push(op);
        attach(plan, op.node, op);
      }
    }

    if (node.children) reconcile(node.children, node.id, plan);
  });
}

function removals(plan: Plan): CardSpecPatchOp[] {
  return [...plan.before]
    .filter(
      ([id, { parentId }]) =>
        !plan.after.has(id) && (parentId === null || plan.after.has(parentId))
    )
    .map(([id]) => ({ op: "remove", id }));
}

// A removal takes the whole subtree with it, so removals are patched in last,
// once every node that outlives them has been moved clear.
export function diff(
  previous: CardSpecNode[],
  next: CardSpecNode[]
): CardSpecPatchOp[] {
  const plan: Plan = {
    before: placements(previous, null, new Map()),
    after: placements(next, null, new Map()),
    containers: new Map(),
    parents: new Map(),
    ops: [],
  };

  track(previous, null, plan);
  reconcile(next, null, plan);

  return [...plan.ops, ...removals(plan)];
}
