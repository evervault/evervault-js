import { useEffect, useState } from "react";
import { applyPatch } from "./spec";
import { inputFor, isCustomFieldInput } from "shared";
import type { CardInput } from "shared";
import type { CardField, CardFrameHostMessages, CardSpecNode } from "types";

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
