import {
  forwardRef,
  PropsWithChildren,
  RefObject,
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
import {
  EvervaultInputContext,
  EvervaultInputContextValue,
  FocusTarget,
} from "../Input";
import { EvervaultContextValue } from "../context";
import { customFieldErrors, customFieldKey } from "./customFields";
import {
  customFieldWarnings,
  expiryLayoutMessage,
  skippedFieldWarning,
} from "./developerMessages";
import { DeclaredFieldsContext } from "./declaredFields";
import type { DeclaredFieldsContextValue } from "./declaredFields";
import { cardFieldSettings } from "./utils";
import type { CardField } from "./types";
import { skippedNodes } from "shared/cardSpec";
import {
  customFieldNodes,
  declaredCustomFields,
  validationRulesKey,
} from "shared/customField";
import { declaredExpiry, expiryLayoutError } from "shared/expiry";
import { canFillDefault } from "shared/defaultValue";
import { declaredProps } from "shared/fieldProps";
import type { CardSpecNode } from "types/cardSpec";

const CARD_FIELDS: CardField[] = ["name", "number", "expiry", "cvc"];

const DEFAULT_ACCEPTED_BRANDS: CardBrandName[] = [];

function sameProps(a: Record<string, string>, b: Record<string, string>) {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => a[key] === b[key])
  );
}

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

  /**
   * Whether to move focus to the next field once one is filled, along the
   * order the fields first rendered in.
   *
   * @default false
   */
  autoProgress?: boolean;
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
    autoProgress = false,
  },
  ref
) {
  const evervault = useEvervault();

  // A ref, so the resolver and onChange read the latest settings without being
  // recreated.
  const declaredSettings = useRef<{
    settings: ReturnType<typeof cardFieldSettings>;
    customFields: ReturnType<typeof declaredCustomFields>;
  }>({ settings: {}, customFields: new Map() });

  // Runs on every check, so it uses the latest settings, the current card number
  // (for the CVC) and the Card.Field rules.
  const resolver = useCallback<Resolver<CardFormValues>>(
    async (values, context, options) => {
      const result = await zodResolver(
        getCardFormSchema(
          acceptedBrands,
          declaredSettings.current.settings,
          values.number
        )
      )(values, context, options);

      // Validating Card.Fields here makes their errors follow the card's
      // validationMode.
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
      autoProgress,
    }),
    [validationMode, autoProgress]
  );

  const focused = useRef<string | null>(null);

  // Declaration order, which auto-advance also follows.
  const [declared, setDeclared] = useState<CardSpecNode[]>([]);
  const inputs = useRef(new Map<string, RefObject<FocusTarget | null>>());
  const order = useRef<CardSpecNode[]>([]);

  const declare = useMemo(
    () => ({
      set(node: CardSpecNode, input: RefObject<FocusTarget | null>) {
        inputs.current.set(node.id, input);

        setDeclared((current) => {
          const index = current.findIndex(({ id }) => id === node.id);

          if (index === -1) return [...current, node];
          if (sameProps(current[index].props, node.props)) return current;

          return current.map((field, i) => (i === index ? node : field));
        });
      },
      remove(id: string) {
        inputs.current.delete(id);
        setDeclared((current) => current.filter((field) => field.id !== id));
      },
      next(id: string) {
        const index = order.current.findIndex((node) => node.id === id);
        if (index === -1) return;

        order.current
          .slice(index + 1)
          .map((node) => inputs.current.get(node.id)?.current)
          .find((input) => input)
          ?.focus();
      },
      focused,
    }),
    []
  );

  const refusal = useMemo(() => {
    const error = expiryLayoutError(declared);
    return error && expiryLayoutMessage(error);
  }, [declared]);

  const [lastValidLayout, setLastValidLayout] = useState(
    refusal ? [] : declared
  );

  if (!refusal && lastValidLayout !== declared) {
    setLastValidLayout(declared);
  }

  // While the expiry layout is invalid, render only fields from the last valid
  // layout that are still declared.
  const nodes = useMemo(() => {
    if (!refusal) return declared;

    const kept = new Set(lastValidLayout.map(({ id }) => id));
    return declared.filter(({ id }) => kept.has(id));
  }, [refusal, lastValidLayout, declared]);

  const skipped = useMemo(() => skippedNodes(nodes), [nodes]);
  order.current = nodes;

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

  const settings = useMemo(
    () => cardFieldSettings(declaredProps(nodes), declaredExpiry(nodes)),
    [nodes]
  );

  const customFields = useMemo(() => declaredCustomFields(nodes), [nodes]);

  declaredSettings.current = { settings, customFields };

  const warned = useRef("");

  // Logs each set of warnings once, not on every render.
  useEffect(() => {
    const notices = [
      ...skipped.map(skippedFieldWarning),
      ...customFieldNodes(nodes)
        .filter((node) => !skipped.includes(node))
        .flatMap(customFieldWarnings),
    ];
    const key = notices.join("\n");

    if (key === warned.current) return;
    warned.current = key;

    notices.forEach((notice) => console.warn(notice));
  }, [nodes, skipped]);

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
            fieldSettings: declaredSettings.current.settings,
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

  // A field showing an error is checked again under its new settings.
  useEffect(() => {
    CARD_FIELDS.forEach((field) => {
      if (methods.getFieldState(field).error) void methods.trigger(field);
    });
    emitChange.current();
  }, [settings]);

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

  const appliedDefaultName = useRef(defaultValues?.name);

  // Bumped by reset() so the default-filling effects run again.
  const [resets, setResets] = useState(0);

  // Fills the holder's default unless the shopper changed the name.
  useEffect(() => {
    const defaultName = settings.name?.defaultValue;

    if (defaultName === undefined || defaultName === appliedDefaultName.current)
      return;

    const name = methods.getValues("name") ?? "";
    if (!canFillDefault(name, appliedDefaultName.current)) return;

    appliedDefaultName.current = defaultName;
    methods.setValue("name", defaultName);
  }, [settings, resets]);

  const filledDefaults = useRef(new Map<string, string>());

  // Fills each Card.Field's default unless the shopper changed the value.
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

  // Re-checks the CVC when the number changes, once it's been left or shows an
  // error.
  useEffect(() => {
    const subscription = methods.watch((_values, { name }) => {
      if (name !== "number") return;

      const cvc = methods.getFieldState("cvc");
      if (cvc.isTouched || cvc.error) void methods.trigger("cvc");
    });

    return () => subscription.unsubscribe();
  }, []);

  useImperativeHandle(
    ref,
    useCallback(
      () => ({
        reset() {
          methods.reset();
          appliedDefaultName.current = defaultValues?.name;
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
