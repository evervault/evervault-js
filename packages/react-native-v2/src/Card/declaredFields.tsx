import {
  ComponentType,
  createContext,
  forwardRef,
  RefAttributes,
  useContext,
  useId,
  useLayoutEffect,
} from "react";
import { COMPONENT_NAMES } from "shared/developerMessages";
import { fieldAttributes } from "shared/fieldProps";
import type { CardSpecNode, CardSpecNodeType } from "types/cardSpec";

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
function useDeclaredField(
  type: CardSpecNodeType,
  props: Record<string, string>
) {
  const { set, remove, shown } = useContext(DeclaredFieldsContext);
  const id = useId();
  const declared = JSON.stringify(props);

  // Removed only on unmount, so a changed field keeps its place.
  useLayoutEffect(() => () => remove(id), [remove, id]);

  useLayoutEffect(
    () =>
      set({ type, id, props: JSON.parse(declared) as Record<string, string> }),
    [set, id, type, declared]
  );

  return shown === null || shown.has(id);
}

// A field declaring the given props in the card's tree, as the web element of
// its type takes them as attributes.
export function declaredField<Props extends object, Ref>(
  type: CardSpecNodeType,
  Field: ComponentType<Props & RefAttributes<Ref>>,
  declares: readonly (keyof Props & string)[]
) {
  const Declared = forwardRef<Ref, Props>(function DeclaredField(props, ref) {
    const shown = useDeclaredField(type, fieldAttributes(declares, props, {}));

    return shown ? <Field {...(props as Props)} ref={ref} /> : null;
  });

  Declared.displayName = COMPONENT_NAMES[type];
  return Declared;
}
