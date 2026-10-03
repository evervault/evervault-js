import {
  ComponentType,
  createContext,
  forwardRef,
  RefAttributes,
  useContext,
  useId,
  useLayoutEffect,
} from "react";
import type { CardSpecNode, CardSpecNodeType } from "types";

export interface DeclaredFieldsContextValue {
  set(node: CardSpecNode): void;
  remove(id: string): void;
  // The fields the card renders; null outside a card, where every field does.
  shown: ReadonlySet<string> | null;
}

export const DeclaredFieldsContext = createContext<DeclaredFieldsContextValue>({
  set: () => {},
  remove: () => {},
  shown: null,
});

// Whether the card renders this field, which it decides once the field has
// declared itself, so a field it leaves out never mounts its input.
function useDeclaredField(type: CardSpecNodeType, name: string | undefined) {
  const { set, remove, shown } = useContext(DeclaredFieldsContext);
  const id = useId();

  // Removed only on unmount, so a renamed field keeps its place.
  useLayoutEffect(() => () => remove(id), [remove, id]);

  useLayoutEffect(
    () => set({ type, id, props: name === undefined ? {} : { name } }),
    [set, id, type, name]
  );

  return shown === null || shown.has(id);
}

export function declaredField<Props extends object, Ref>(
  type: CardSpecNodeType,
  Field: ComponentType<Props & RefAttributes<Ref>>,
  nameOf?: (props: Props) => string
) {
  return forwardRef<Ref, Props>(function DeclaredField(props, ref) {
    const shown = useDeclaredField(type, nameOf?.(props as Props));

    return shown ? <Field {...(props as Props)} ref={ref} /> : null;
  });
}
