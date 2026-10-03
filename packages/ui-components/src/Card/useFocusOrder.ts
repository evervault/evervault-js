import { useCallback, useEffect, useMemo, useRef } from "react";
import type { CardInput } from "./types";

// Each reports whether there was an input to move to.
export interface FocusOrder {
  next: (input: CardInput) => boolean;
  previous: (input: CardInput) => boolean;
}

// Moves focus along the inputs in the order the card renders them, so
// auto-advance and native tab order agree.
export function useFocusOrder(order: CardInput[]): FocusOrder {
  // A patch can reorder the card, so the order is read when focus moves.
  const current = useRef(order);

  useEffect(() => {
    current.current = order;
  }, [order]);

  const move = useCallback((input: CardInput, offset: number) => {
    const index = current.current.indexOf(input);

    if (index === -1) return false;

    // No wrapping: the ends of the order are where auto-advance stops.
    const target = current.current[index + offset];

    if (!target) return false;

    const element = document.getElementById(target);

    if (!element) return false;

    element.focus();
    return true;
  }, []);

  return useMemo(
    () => ({
      next: (input: CardInput) => move(input, 1),
      previous: (input: CardInput) => move(input, -1),
    }),
    [move]
  );
}
