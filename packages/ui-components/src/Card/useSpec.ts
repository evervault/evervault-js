import { useEffect, useState } from "react";
import { applyPatch } from "./spec";
import type { CardField, CardFrameHostMessages, CardSpecNode } from "types";

// The fields a tree renders, first declaration first.
export function declaredFields(spec: CardSpecNode[]): CardField[] {
  const fields = spec.flatMap((node) => {
    if (node.type === "row") return declaredFields(node.children ?? []);

    return [node.type];
  });

  return [...new Set(fields)];
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
