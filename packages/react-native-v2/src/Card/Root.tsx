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
import {
  DeepPartial,
  FieldErrors,
  FormProvider,
  Resolver,
  useForm,
} from "react-hook-form";
import { CardFormValues, getCardFormSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEvervault } from "../useEvervault";
import { formatPayload } from "./utils";
import { EvervaultInputContext, EvervaultInputContextValue } from "../Input";
import { EvervaultContextValue } from "../context";
import { customFieldErrors, customFieldKey } from "./customFields";
import {
  customFieldWarnings,
  expiryLayoutMessage,
  skippedFieldWarning,
} from "./developerMessages";
import { DeclaredFieldsContext } from "./declaredFields";
import type { DeclaredFieldsContextValue } from "./declaredFields";
import { skippedNodes } from "shared/cardSpec";
import {
  customFieldNodes,
  declaredCustomFields,
  validationRulesKey,
} from "shared/customField";
import { expiryLayoutError } from "shared/expiry";
import { canFillDefault } from "shared/defaultValue";
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

  // What the declared fields set, read when validating and reporting.
  const declaredSettings = useRef<{
    customFields: ReturnType<typeof declaredCustomFields>;
  }>({ customFields: new Map() });

  const resolver = useCallback<Resolver<CardFormValues>>(
    async (values, context, options) => {
      const result = await zodResolver(getCardFormSchema(acceptedBrands))(
        values,
        context,
        options
      );

      // Card.Fields are checked with the card's fields, so whenever the
      // validation mode checks one.
      const fields = customFieldErrors(
        values,
        declaredSettings.current.customFields
      );
      if (!fields) return result;

      return {
        values: {},
        errors: { ...result.errors, fields } as FieldErrors<CardFormValues>,
      };
    },
    [acceptedBrands]
  );

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

  const customFields = useMemo(() => declaredCustomFields(nodes), [nodes]);

  declaredSettings.current = { customFields };

  const notices = useMemo(
    () => [
      ...skipped.map(skippedFieldWarning),
      ...customFieldNodes(nodes)
        .filter((node) => !skipped.includes(node))
        .flatMap(customFieldWarnings),
    ],
    [nodes, skipped]
  );

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
            customFields: declaredSettings.current.customFields,
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

  const rulesKeys = useRef(new Map<string, string>());

  // A value typed under other rules is dropped, with its error, as on the web.
  useEffect(() => {
    const keys = new Map(
      [...customFields].map(([name, field]) => [
        name,
        validationRulesKey(field),
      ])
    );

    keys.forEach((key, name) => {
      const previous = rulesKeys.current.get(name);
      const field = customFieldKey(name) as keyof CardFormValues;

      if (previous !== undefined && previous !== key) {
        methods.resetField(field, { defaultValue: "" });
      } else if (methods.getFieldState(field).error) {
        // A field showing an error is checked again under its new settings.
        void methods.trigger(field);
      }
    });

    rulesKeys.current = keys;
    emitChange.current();
  }, [customFields]);

  // Counts resets, so the declared defaults are filled in again after one.
  const [resets, setResets] = useState(0);

  // The default last filled into each Card.Field, by name.
  const filledDefaults = useRef(new Map<string, string>());

  // A default fills a Card.Field while it is empty or still holds the last one.
  useEffect(() => {
    customFields.forEach(({ defaultValue }, name) => {
      const previous = filledDefaults.current.get(name);

      if (defaultValue === undefined || defaultValue === previous) return;

      filledDefaults.current.set(name, defaultValue);

      const key = customFieldKey(name) as keyof CardFormValues;
      const value = (methods.getValues(key) as string | undefined) ?? "";

      if (canFillDefault(value, previous)) methods.setValue(key, defaultValue);
    });
  }, [customFields, resets]);

  useImperativeHandle(
    ref,
    useCallback(
      () => ({
        reset() {
          methods.reset();
          filledDefaults.current.clear();
          setResets((count) => count + 1);
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
