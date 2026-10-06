import {
  ComponentType,
  createContext,
  forwardRef,
  RefAttributes,
  RefObject,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { COMPONENT_NAMES } from "shared/developerMessages";
import { fieldAttributes } from "shared/fieldProps";
import type { CardSpecNode, CardSpecNodeType } from "types/cardSpec";
import { FocusOrderContext, FocusTarget } from "../Input";
import type { FocusOrderContextValue } from "../Input";
import { mergeRefs } from "../utils";
import { fieldOutsideCard } from "./developerMessages";

export interface DeclaredFieldsContextValue {
  set(node: CardSpecNode, input: RefObject<FocusTarget | null>): void;
  remove(id: string): void;
  // The ids of the fields the card renders.
  shown: ReadonlySet<string>;
  // Focuses the first rendered field declared after this one.
  next(id: string): void;
  focused: FocusOrderContextValue["focused"];
}

export const DeclaredFieldsContext =
  createContext<DeclaredFieldsContextValue | null>(null);

// Registers the field with the card and returns whether the card renders it;
// nothing renders until the card has seen it.
function useDeclaredField(
  type: CardSpecNodeType,
  props: Record<string, string>,
  input: RefObject<FocusTarget | null>
) {
  const card = useContext(DeclaredFieldsContext);
  if (!card) throw new Error(fieldOutsideCard(type));

  const { set, remove, shown, next, focused } = card;
  const id = useId();

  // `props` is a new object every render; its JSON, with keys always in
  // `declares` order, only changes when a prop does.
  const declared = JSON.stringify(props);

  // A separate effect, so changed props update the field in place rather than
  // moving it to the end.
  useLayoutEffect(() => () => remove(id), [remove, id]);

  useLayoutEffect(
    () =>
      set(
        { type, id, props: JSON.parse(declared) as Record<string, string> },
        input
      ),
    [set, id, type, declared, input]
  );

  const focusOrder = useMemo<FocusOrderContextValue>(
    () => ({ next: () => next(id), focused }),
    [next, id, focused]
  );

  return { shown: shown.has(id), focusOrder };
}

// Wraps a card field so it registers with the card; `declares` lists the props
// sent to it.
export function declaredField<Ref extends FocusTarget, Props extends object>(
  type: CardSpecNodeType,
  Field: ComponentType<Props & RefAttributes<Ref>>,
  declares: readonly (keyof Props & string)[]
) {
  const Declared = forwardRef<Ref, Props>((props, ref) => {
    const input = useRef<Ref>(null);
    const { shown, focusOrder } = useDeclaredField(
      type,
      fieldAttributes(declares, props, {}),
      input
    );

    if (!shown) return null;

    return (
      <FocusOrderContext.Provider value={focusOrder}>
        <Field {...(props as Props)} ref={mergeRefs(ref, input)} />
      </FocusOrderContext.Provider>
    );
  });

  Declared.displayName = COMPONENT_NAMES[type];
  return Declared;
}
