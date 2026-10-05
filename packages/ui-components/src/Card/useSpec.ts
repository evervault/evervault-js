import { useEffect, useState } from "react";
import { applyPatch } from "./spec";
import type { CardInput } from "./types";
import type { CardField, CardFrameHostMessages, CardSpecNode } from "types";

// The input a node renders: a field its own, each half of a split expiry one
// of the two that write the expiry.
export function inputFor(
  type: Exclude<CardSpecNode["type"], "row">
): CardInput {
  if (type === "expiryMonth") return "expiry-month";
  if (type === "expiryYear") return "expiry-year";
  return type;
}

export function fieldOf(input: CardInput): CardField {
  return input === "expiry-month" || input === "expiry-year" ? "expiry" : input;
}

// The inputs a tree renders, first declaration first.
export function declaredInputs(spec: CardSpecNode[]): CardInput[] {
  const inputs = spec.flatMap((node) => {
    if (node.type === "row") return declaredInputs(node.children ?? []);

    return [inputFor(node.type)];
  });

  return [...new Set(inputs)];
}

// The fields a tree renders, first declaration first.
export function declaredFields(spec: CardSpecNode[]): CardField[] {
  return [...new Set(declaredInputs(spec).map(fieldOf))];
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
