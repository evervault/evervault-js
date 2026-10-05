import { useEffect, useState } from "react";
import { applyPatch } from "./spec";
import type { CardInput, CustomFieldInputId } from "./types";
import type { CardField, CardFrameHostMessages, CardSpecNode } from "types";

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

// The card value an input writes: the expiry halves write "expiry"; an
// <ev-field> writes none.
export function cardFieldWrittenBy(input: CardInput): CardField | null {
  if (input === "expiry-month" || input === "expiry-year") return "expiry";
  if (isCustomFieldInput(input)) return null;
  return input as CardField;
}

// The inputs a tree renders, first declaration first.
export function declaredInputs(spec: CardSpecNode[]): CardInput[] {
  const inputs = spec.flatMap((node) => {
    if (node.type === "row") return declaredInputs(node.children ?? []);

    const input = inputFor(node);
    return input ? [input] : [];
  });

  return [...new Set(inputs)];
}

// The card fields a tree renders, first declaration first.
export function declaredFields(spec: CardSpecNode[]): CardField[] {
  return [
    ...new Set(
      declaredInputs(spec)
        .map(cardFieldWrittenBy)
        .filter((field) => field !== null)
    ),
  ];
}

type Subscribe = <T extends keyof CardFrameHostMessages>(
  type: T,
  callback: (payload: CardFrameHostMessages[T]) => void
) => () => void;

// A new seed is the host's whole picture and replaces the tree; a patch is
// relative to whatever the tree is when it lands.
export function useSpec(on: Subscribe, seed: CardSpecNode[]) {
  const [state, setState] = useState({ seed, spec: seed });

  let spec = state.spec;

  if (state.seed !== seed) {
    spec = seed;
    setState({ seed, spec });
  }

  useEffect(
    () =>
      on("EV_SPEC_PATCH", ({ ops }) => {
        setState((current) => ({
          ...current,
          spec: applyPatch(current.spec, ops),
        }));
      }),
    [on]
  );

  return spec;
}
