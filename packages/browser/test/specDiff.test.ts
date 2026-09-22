import { describe, expect, it, vi } from "vitest";
import type { CardSpecNode, CardSpecPatchOp } from "types";
import { diff } from "../lib/ui/specDiff";

// Loaded at runtime: a static import would pull a ui-components file into this
// package's tsconfig.
const { applyPatch } = await vi.importActual<{
  applyPatch: (spec: CardSpecNode[], ops: CardSpecPatchOp[]) => CardSpecNode[];
}>("../../ui-components/src/Card/spec");

describe("diff", () => {
  function node(id: string, props: Record<string, string> = {}) {
    return { type: "number" as const, id, props };
  }

  function row(id: string, children: ReturnType<typeof node>[]) {
    return { type: "row" as const, id, props: {}, children };
  }

  it("has no ops when nothing changed", () => {
    const spec = [node("a"), node("b")];

    expect(diff(spec, spec)).toEqual([]);
  });

  it("inserts a node that was not there before", () => {
    const ops = diff([node("a")], [node("a"), node("b")]);

    expect(ops).toEqual([
      { op: "insert", parentId: null, index: 1, node: node("b") },
    ]);
  });

  it("removes a node that is gone", () => {
    const ops = diff([node("a"), node("b")], [node("a")]);

    expect(ops).toEqual([{ op: "remove", id: "b" }]);
  });

  it("updates a node whose props changed", () => {
    const ops = diff([node("a")], [node("a", { placeholder: "Number" })]);

    expect(ops).toEqual([
      { op: "update", id: "a", props: { placeholder: "Number" } },
    ]);
  });

  it("moves a node whose position changed", () => {
    const ops = diff([node("a"), node("b")], [node("b"), node("a")]);

    expect(ops).toContainEqual({
      op: "move",
      id: "b",
      parentId: null,
      index: 0,
    });
  });

  it("does not move the nodes left behind by a removal", () => {
    const ops = diff([node("a"), node("b"), node("c")], [node("a"), node("c")]);

    expect(ops).not.toContainEqual(expect.objectContaining({ op: "move" }));
    expect(ops).toContainEqual({ op: "remove", id: "b" });
  });

  it("fills a row that had no children in order", () => {
    const bare = { type: "row" as const, id: "row", props: {} };
    const ops = diff([bare], [row("row", [node("a"), node("b")])]);

    expect(applyPatch([bare], ops)).toEqual([
      row("row", [node("a"), node("b")]),
    ]);
  });

  it("diffs the children of a row against the row id", () => {
    const ops = diff(
      [row("row", [node("a")])],
      [row("row", [node("a"), node("b")])]
    );

    expect(ops).toEqual([
      { op: "insert", parentId: "row", index: 1, node: node("b") },
    ]);
  });

  it("moves a node between rows against its new row", () => {
    const ops = diff(
      [row("one", [node("a")]), row("two", [])],
      [row("one", []), row("two", [node("a")])]
    );

    expect(ops).toEqual([{ op: "move", id: "a", parentId: "two", index: 0 }]);
  });

  it("moves a node into a row against the row", () => {
    const ops = diff([node("a"), row("one", [])], [row("one", [node("a")])]);

    expect(ops).toEqual([{ op: "move", id: "a", parentId: "one", index: 0 }]);
  });

  it("moves a node out of a row against the card", () => {
    const ops = diff([row("one", [node("a")])], [node("a"), row("one", [])]);

    expect(ops).toEqual([{ op: "move", id: "a", parentId: null, index: 0 }]);
  });

  it("inserts a new row without the node moving into it", () => {
    const ops = diff([node("a")], [row("r", [node("a")])]);

    expect(ops).toEqual([
      { op: "insert", parentId: null, index: 1, node: row("r", []) },
      { op: "move", id: "a", parentId: "r", index: 0 },
    ]);
  });

  it("removes only the top of a subtree that is gone", () => {
    const ops = diff([row("r", [node("a")])], []);

    expect(ops).toEqual([{ op: "remove", id: "r" }]);
  });
});

describe("diff and applyPatch", () => {
  function node(id: string, props: Record<string, string> = {}): CardSpecNode {
    return { type: "number", id, props };
  }

  function row(id: string, children: CardSpecNode[]): CardSpecNode {
    return { type: "row", id, props: {}, children };
  }

  function roundTrip(previous: CardSpecNode[], next: CardSpecNode[]) {
    return applyPatch(previous, diff(previous, next));
  }

  it("reorders the children of a card", () => {
    const previous = [node("a"), node("b"), node("c")];
    const next = [node("c"), node("a"), node("b")];

    expect(roundTrip(previous, next)).toEqual(next);
  });

  it("reorders the children of a card around a node that keeps its rank", () => {
    const previous = [node("a"), node("b"), node("c"), node("d")];
    const next = [node("c"), node("b"), node("d"), node("a")];

    expect(roundTrip(previous, next)).toEqual(next);
  });

  it("reorders the children of a row", () => {
    const previous = [row("r", [node("a"), node("b"), node("c")])];
    const next = [row("r", [node("b"), node("c"), node("a")])];

    expect(roundTrip(previous, next)).toEqual(next);
  });

  it("moves a node out of a row to before it", () => {
    const previous = [row("r", [node("a"), node("b")])];
    const next = [node("b"), row("r", [node("a")])];

    expect(roundTrip(previous, next)).toEqual(next);
  });

  it("moves a node out of a row to after it", () => {
    const previous = [row("r", [node("a"), node("b")])];
    const next = [row("r", [node("a")]), node("b")];

    expect(roundTrip(previous, next)).toEqual(next);
  });

  it("moves a node into a row from before it", () => {
    const previous = [node("b"), row("r", [node("a")])];
    const next = [row("r", [node("b"), node("a")])];

    expect(roundTrip(previous, next)).toEqual(next);
  });

  it("moves a node into a row from after it", () => {
    const previous = [row("r", [node("a")]), node("b")];
    const next = [row("r", [node("a"), node("b")])];

    expect(roundTrip(previous, next)).toEqual(next);
  });

  it("moves a node from the first row to the second", () => {
    const previous = [row("one", [node("a"), node("b")]), row("two", [])];
    const next = [row("one", [node("a")]), row("two", [node("b")])];

    expect(roundTrip(previous, next)).toEqual(next);
  });

  it("moves a node from the second row to the first", () => {
    const previous = [row("one", [node("a")]), row("two", [node("b")])];
    const next = [row("one", [node("b"), node("a")]), row("two", [])];

    expect(roundTrip(previous, next)).toEqual(next);
  });

  it("moves a node into a row that is itself new", () => {
    const previous = [node("a"), node("b")];
    const next = [node("a"), row("r", [node("b")])];

    expect(roundTrip(previous, next)).toEqual(next);
  });

  it("moves a node out of a row that is itself gone", () => {
    const previous = [row("r", [node("a")]), node("b")];
    const next = [node("b"), node("a")];

    expect(roundTrip(previous, next)).toEqual(next);
  });

  it("moves a row into another row", () => {
    const previous = [row("one", [node("a")]), row("two", [node("b")])];
    const next = [row("two", [node("b"), row("one", [node("a")])])];

    expect(roundTrip(previous, next)).toEqual(next);
  });

  it("moves, inserts, removes and updates at once", () => {
    const previous = [
      node("a"),
      row("r", [node("b"), node("c"), node("d")]),
      node("e"),
    ];
    const next = [
      node("c", { placeholder: "CVC" }),
      row("r", [node("a"), node("b")]),
      node("f"),
    ];

    expect(roundTrip(previous, next)).toEqual(next);
  });

  it("patches every removal in after the last node has moved clear", () => {
    const ops = diff(
      [row("r", [node("a")]), node("b")],
      [node("b"), node("a")]
    );

    const firstRemove = ops.findIndex((op) => op.op === "remove");
    const lastMove = ops.findLastIndex((op) => op.op === "move");

    expect(ops.filter((op) => op.op === "remove")).toHaveLength(1);
    expect(lastMove).toBeGreaterThan(-1);
    expect(firstRemove).toBeGreaterThan(lastMove);
  });

  it("keeps the identity of a node moving between rows", () => {
    const moved = node("b");
    const previous = [row("one", [node("a"), moved]), row("two", [])];
    const next = [row("one", [node("a")]), row("two", [node("b")])];

    const spec = roundTrip(previous, next);

    expect(spec[1].children?.[0]).toBe(moved);
  });

  it("keeps the identity of the descendants of a moving row", () => {
    const nested = node("a");
    const previous = [row("one", [nested]), row("two", [])];
    const next = [row("two", [row("one", [node("a")])])];

    const spec = roundTrip(previous, next);

    expect(spec[0].children?.[0].children?.[0]).toBe(nested);
  });

  it("keeps the identity of a node moving into a row that is itself new", () => {
    const moved = node("b");
    const previous = [node("a"), moved];
    const next = [node("a"), row("r", [node("b")])];

    const spec = roundTrip(previous, next);

    expect(spec[1].children?.[0]).toBe(moved);
  });

  it("keeps the identity of a node moving out of a row that is itself gone", () => {
    const moved = node("a");
    const previous = [row("r", [moved]), node("b")];
    const next = [node("b"), node("a")];

    expect(roundTrip(previous, next)[1]).toBe(moved);
  });

  it("keeps the identity of a row the patch leaves alone", () => {
    const untouched = row("one", [node("a")]);
    const previous = [untouched, row("two", [node("b")])];
    const next = [untouched, row("two", [node("b"), node("c")])];

    expect(roundTrip(previous, next)[0]).toBe(untouched);
  });
});
