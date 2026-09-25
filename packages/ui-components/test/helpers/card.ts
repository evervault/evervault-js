import { fireEvent } from "@testing-library/react";
import { act } from "react";
import type { CardSpecNode, CardSpecPatchOp } from "types";

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

export function inserts(nodes: CardSpecNode[]): CardSpecPatchOp[] {
  return nodes.map((node, index) => ({
    op: "insert",
    parentId: null,
    index,
    node,
  }));
}

// The card's EV_SPEC_PATCH listener, captured by each file's messaging mock.
export const spec = {
  patch: (() => {}) as (payload: { ops: CardSpecPatchOp[] }) => void,
};

export function apply(ops: CardSpecPatchOp[]) {
  act(() => {
    spec.patch({ ops });
  });
}

export function fieldNames(container: HTMLElement) {
  return [...container.querySelectorAll("[ev-name]")].map((field) =>
    field.getAttribute("ev-name")
  );
}

export function input(container: HTMLElement, id: string) {
  const found = container.querySelector<HTMLInputElement>(`#${id}`);
  if (!found) throw new Error(`no ${id} input`);
  return found;
}

// imask reads the element on input, so a value must arrive as an input event.
export function type(element: HTMLInputElement, value: string) {
  element.focus();
  fireEvent.keyDown(element, { key: value.slice(-1) });
  fireEvent.input(element, { target: { value } });
}

// Flushes the promises the card's encrypt-on-change re-render queues.
export async function settle() {
  await act(async () => {});
}
