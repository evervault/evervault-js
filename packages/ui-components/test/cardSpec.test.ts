import { describe, expect, it } from "vitest";
import { applyPatch } from "../src/Card/spec";
import type { CardSpecNode } from "types";

function node(id: string, props: Record<string, string> = {}): CardSpecNode {
  return { type: "number", id, props };
}

function row(id: string, children: CardSpecNode[]): CardSpecNode {
  return { type: "row", id, props: {}, children };
}

describe("applyPatch", () => {
  it("inserts a node at its index", () => {
    const spec = applyPatch(
      [node("a")],
      [{ op: "insert", parentId: null, index: 0, node: node("b") }]
    );

    expect(spec.map((entry) => entry.id)).toEqual(["b", "a"]);
  });

  it("removes a node by id", () => {
    const spec = applyPatch(
      [node("a"), node("b")],
      [{ op: "remove", id: "a" }]
    );

    expect(spec.map((entry) => entry.id)).toEqual(["b"]);
  });

  it("updates the props of a node by id", () => {
    const spec = applyPatch(
      [node("a"), node("b")],
      [{ op: "update", id: "b", props: { placeholder: "CVC" } }]
    );

    expect(spec[1].props).toEqual({ placeholder: "CVC" });
  });

  it("moves a node to its new index", () => {
    const spec = applyPatch(
      [node("a"), node("b"), node("c")],
      [{ op: "move", id: "c", parentId: null, index: 0 }]
    );

    expect(spec.map((entry) => entry.id)).toEqual(["c", "a", "b"]);
  });

  it("counts the move index without the node being moved", () => {
    const spec = applyPatch(
      [node("a"), node("b"), node("c")],
      [{ op: "move", id: "a", parentId: null, index: 2 }]
    );

    expect(spec.map((entry) => entry.id)).toEqual(["b", "c", "a"]);
  });

  it("applies an op to the children of a row", () => {
    const spec = applyPatch(
      [row("row", [node("a")])],
      [{ op: "insert", parentId: "row", index: 1, node: node("b") }]
    );

    expect(spec[0].children?.map((entry) => entry.id)).toEqual(["a", "b"]);
  });

  it("carries a child from one row to another", () => {
    const spec = applyPatch(
      [row("one", [node("a"), node("b")]), row("two", [node("c")])],
      [{ op: "move", id: "b", parentId: "two", index: 0 }]
    );

    expect(spec[0].children?.map((entry) => entry.id)).toEqual(["a"]);
    expect(spec[1].children?.map((entry) => entry.id)).toEqual(["b", "c"]);
  });

  it("carries a child into a row", () => {
    const spec = applyPatch(
      [node("a"), row("one", [node("b")])],
      [{ op: "move", id: "a", parentId: "one", index: 0 }]
    );

    expect(spec.map((entry) => entry.id)).toEqual(["one"]);
    expect(spec[0].children?.map((entry) => entry.id)).toEqual(["a", "b"]);
  });

  it("carries a child out of a row", () => {
    const spec = applyPatch(
      [row("one", [node("a"), node("b")])],
      [{ op: "move", id: "a", parentId: null, index: 0 }]
    );

    expect(spec.map((entry) => entry.id)).toEqual(["a", "one"]);
    expect(spec[1].children?.map((entry) => entry.id)).toEqual(["b"]);
  });

  it("carries a child with its whole subtree", () => {
    const spec = applyPatch(
      [row("one", [row("two", [node("a")])]), row("three", [])],
      [{ op: "move", id: "two", parentId: "three", index: 0 }]
    );

    expect(spec[0].children).toEqual([]);
    expect(spec[1].children?.[0].children?.map((entry) => entry.id)).toEqual([
      "a",
    ]);
  });

  it("leaves the spec alone when the moved node is not there", () => {
    const spec = [node("a")];

    expect(
      applyPatch(spec, [{ op: "move", id: "b", parentId: null, index: 0 }])
    ).toBe(spec);
  });

  it("leaves the spec alone when the row moved into is not there", () => {
    const carried = node("a");
    const spec = [row("one", [carried])];

    const patched = applyPatch(spec, [
      { op: "move", id: "a", parentId: "ghost", index: 0 },
    ]);

    expect(patched).toBe(spec);
    expect(patched[0].children?.[0]).toBe(carried);
  });

  it("leaves the spec alone when a row is moved inside itself", () => {
    const spec = [row("one", [row("two", [node("a")])])];

    expect(
      applyPatch(spec, [{ op: "move", id: "one", parentId: "two", index: 0 }])
    ).toBe(spec);
  });

  it("removes a node at every depth", () => {
    const spec = applyPatch(
      [node("a"), row("row", [node("b")])],
      [{ op: "remove", id: "b" }]
    );

    expect(spec[1].children).toEqual([]);
  });

  it("applies every op in order", () => {
    const spec = applyPatch(
      [node("a")],
      [
        { op: "insert", parentId: null, index: 1, node: node("b") },
        { op: "remove", id: "a" },
      ]
    );

    expect(spec.map((entry) => entry.id)).toEqual(["b"]);
  });

  it("keeps the identity of the nodes a patch does not touch", () => {
    const untouched = node("a");
    const spec = applyPatch(
      [untouched],
      [{ op: "insert", parentId: null, index: 1, node: node("b") }]
    );

    expect(spec[0]).toBe(untouched);
  });

  it("keeps the identity of a node a move carries into another row", () => {
    const moved = row("two", [node("a")]);
    const spec = applyPatch(
      [row("one", [moved]), row("three", [])],
      [{ op: "move", id: "two", parentId: "three", index: 0 }]
    );

    expect(spec[1].children?.[0]).toBe(moved);
  });

  it("keeps the identity of the rows a move does not reach", () => {
    const untouched = row("one", [node("a")]);
    const spec = applyPatch(
      [untouched, row("two", [node("b"), node("c")])],
      [{ op: "move", id: "c", parentId: "two", index: 0 }]
    );

    expect(spec[0]).toBe(untouched);
  });
});
