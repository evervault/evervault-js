import {
  forwardRef,
  PropsWithChildren,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { CardBrandName, CardConfig, CardPayload } from "./types";
import { DeepPartial, FormProvider, useForm } from "react-hook-form";
import { CardFormValues, getCardFormSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEvervault } from "../useEvervault";
import { formatPayload } from "./utils";
import { EvervaultInputContext, EvervaultInputContextValue } from "../Input";
import { EvervaultContextValue } from "../context";
import { expiryLayoutMessage, skippedFieldWarning } from "./developerMessages";
import { DeclaredFieldsContext } from "./declaredFields";
import type { DeclaredFieldsContextValue } from "./declaredFields";
import { skippedNodes } from "shared/cardSpec";
import { expiryLayoutError } from "shared/expiry";
import type { CardSpecNode } from "types/cardSpec";

const DEFAULT_ACCEPTED_BRANDS: CardBrandName[] = [];

export interface CardProps extends PropsWithChildren, CardConfig {
  /**
   * The default values to use for the form.
   */
  defaultValues?: {
    name?: string;
    number?: string;
    expiry?: string;
    cvc?: string;
  };

  /**
   * Triggered whenever the component's state is updated.
   */
  onChange?(payload: CardPayload): void;

  /**
   * Triggered when a native error occurs.
   */
  onError?(error: Error): void;

  /**
   * The validation mode to use for the form.
   *
   * - `onChange`: Validate the form when the user changes a field.
   * - `onBlur`: Validate the form when the user leaves a field.
   * - `onTouched`: Validate the form when the user touches a field.
   * - `all`: Validate the form when the user changes or leaves a field.
   *
   * @default "all"
   */
  validationMode?: "onChange" | "onBlur" | "onTouched" | "all";
}

export interface Card {
  /**
   * Resets the form to its default values and state.
   */
  reset(): void;
}

export const Card = forwardRef<Card, CardProps>(function Card(
  {
    children,
    defaultValues,
    onChange,
    onError,
    acceptedBrands = DEFAULT_ACCEPTED_BRANDS,
    validationMode = "all",
  },
  ref
) {
  const evervault = useEvervault();

  const resolver = useMemo(() => {
    const schema = getCardFormSchema(acceptedBrands);
    return zodResolver(schema);
  }, [acceptedBrands]);

  const methods = useForm<CardFormValues>({
    defaultValues,
    resolver,
    mode: validationMode,
    shouldUseNativeValidation: false,
  });

  const inputContext = useMemo<EvervaultInputContextValue>(
    () => ({
      validationMode,
    }),
    [validationMode]
  );

  const focused = useRef<string | null>(null);

  // The fields in the order they declared themselves, as the card's tree.
  const [declared, setDeclared] = useState<CardSpecNode[]>([]);

  const declare = useMemo(
    () => ({
      set(node: CardSpecNode) {
        setDeclared((current) => {
          const index = current.findIndex(({ id }) => id === node.id);

          if (index === -1) return [...current, node];
          if (
            JSON.stringify(current[index].props) === JSON.stringify(node.props)
          ) {
            return current;
          }

          return current.map((field, i) => (i === index ? node : field));
        });
      },
      remove(id: string) {
        setDeclared((current) => current.filter((field) => field.id !== id));
      },
      focused,
    }),
    []
  );

  const refusal = useMemo(() => {
    const error = expiryLayoutError(declared);
    return error && expiryLayoutMessage(error);
  }, [declared]);

  // A refused tree leaves the card on the last one it could render.
  const [renderable, setRenderable] = useState(refusal ? [] : declared);

  if (!refusal && renderable !== declared) {
    setRenderable(declared);
  }

  // Of the last tree it could render, only the fields still declared remain.
  const nodes = useMemo(() => {
    if (!refusal) return declared;

    const kept = new Set(renderable.map(({ id }) => id));
    return declared.filter(({ id }) => kept.has(id));
  }, [refusal, renderable, declared]);

  const skipped = useMemo(() => skippedNodes(nodes), [nodes]);

  const declaredFieldsContext = useMemo<DeclaredFieldsContextValue>(
    () => ({
      ...declare,
      shown: new Set(
        nodes.filter((node) => !skipped.includes(node)).map(({ id }) => id)
      ),
    }),
    [declare, nodes, skipped]
  );

  useEffect(() => {
    if (refusal) console.error(refusal);
  }, [refusal]);

  const notices = useMemo(() => skipped.map(skippedFieldWarning), [skipped]);

  // In an effect, not the render body, so a re-render does not warn again.
  const warned = useRef("");

  useEffect(() => {
    const key = notices.join("\n");

    if (key === warned.current) return;
    warned.current = key;

    notices.forEach((notice) => console.warn(notice));
  }, [notices]);

  const emitChange = useRef<() => void>(() => {});

  // Use refs to prevent closures from being captured
  const onChangeRef = useRef<typeof onChange>(onChange);
  onChangeRef.current = onChange;
  const onErrorRef = useRef<typeof onError>(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (!onChange) return;

    let abortController: AbortController | undefined;
    function handleChange(values: DeepPartial<CardFormValues>) {
      if (abortController) {
        abortController.abort();
      }

      abortController = new AbortController();
      const signal = abortController.signal;

      requestAnimationFrame(async () => {
        try {
          const payload = await formatPayload(values, {
            encrypt: evervault.encrypt,
            form: methods,
          });
          if (signal.aborted) return;
          onChangeRef.current?.(payload);
        } catch (error) {
          onErrorRef.current?.(error as Error);
        }
      });
    }

    emitChange.current = () => handleChange(methods.getValues());
    handleChange(methods.getValues());
    const subscription = methods.watch(handleChange);
    return () => {
      emitChange.current = () => {};
      subscription.unsubscribe();
    };
  }, [evervault.encrypt]);

  // A field declared or dropped changes the payload without a value changing.
  useEffect(() => emitChange.current(), [declared]);

  useImperativeHandle(
    ref,
    useCallback(
      () => ({
        reset() {
          methods.reset();
        },
      }),
      []
    )
  );

  return (
    <FormProvider {...methods}>
      <EvervaultInputContext.Provider value={inputContext}>
        <DeclaredFieldsContext.Provider value={declaredFieldsContext}>
          {children}
        </DeclaredFieldsContext.Provider>
      </EvervaultInputContext.Provider>
    </FormProvider>
  );
});
