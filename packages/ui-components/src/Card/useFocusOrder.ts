import { useCallback, useMemo, useRef } from "react";
import type { CardField } from "types";

// Each reports whether there was a field to move to.
export interface FocusOrder {
  next: (field: CardField) => boolean;
  previous: (field: CardField) => boolean;
}

// Moves focus along the fields in the order the card renders them, so
// auto-advance and native tab order agree.
export function useFocusOrder(order: CardField[]): FocusOrder {
  // A patch can reorder the card, so the order is read when focus moves.
  const current = useRef(order);
  current.current = order;

  const move = useCallback((field: CardField, offset: number) => {
    const index = current.current.indexOf(field);

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
      next: (field: CardField) => move(field, 1),
      previous: (field: CardField) => move(field, -1),
    }),
    [move]
  );
}
