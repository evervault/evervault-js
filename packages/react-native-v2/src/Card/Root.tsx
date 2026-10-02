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
import { DeepPartial, FormProvider, Resolver, useForm } from "react-hook-form";
import { CardFormValues, getCardFormSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEvervault } from "../useEvervault";
import { formatPayload } from "./utils";
import {
  EvervaultInputContext,
  EvervaultInputContextValue,
  FocusOrderContext,
  FocusOrderContextValue,
  FocusTarget,
} from "../Input";
import { EvervaultContextValue } from "../context";
import {
  checkedRules,
  CustomFieldsContext,
  CustomFieldsContextValue,
  DeclaredCustomField,
  rulesByName,
} from "./customFields";
import {
  expiryLayoutMessage,
  skippedFieldWarning,
  unreportableFieldName,
} from "./developerMessages";
import { DeclaredFieldsContext } from "./declaredFields";
import type { DeclaredFieldsContextValue } from "./declaredFields";
import type { CardFieldSettings } from "shared/cardFieldSettings";
import { skippedNodes } from "shared/cardSpec";
import { validationRulesKey } from "shared/customField";
import { expiryLayoutError } from "shared/expiry";
import type { CardSpecNode } from "types";
import {
  CardFieldSettingsContext,
  CardFieldSettingsContextValue,
  CardInputName,
  settingsByField,
} from "./fieldSettings";

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

  const fieldSettings = useRef(
    new Map<string, { field: CardInputName; settings: CardFieldSettings }>()
  );

  // Built when validating, from the settings the fields registered and the
  // number the security code is checked against.
  const resolver = useCallback<Resolver<CardFormValues>>(
    (values, context, options) =>
      zodResolver(
        getCardFormSchema(
          acceptedBrands,
          settingsByField(fieldSettings.current),
          values.number
        )
      )(values, context, options),
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

  const focusTargets = useRef<FocusTarget[]>([]);
  const focused = useRef<string | null>(null);

  // Stable, so the inputs never register again and lose their first order.
  const focusOrder = useMemo<FocusOrderContextValue>(
    () => ({
      register(target) {
        focusTargets.current.push(target);

        return () => {
          focusTargets.current = focusTargets.current.filter(
            (registered) => registered !== target
          );
        };
      },
      next(target) {
        const targets = focusTargets.current;
        const index = targets.indexOf(target);
        if (index !== -1) targets[index + 1]?.focus();
      },
      focused,
    }),
    []
  );

  // The fields in the order they declared themselves, as the card's tree.
  const [declared, setDeclared] = useState<CardSpecNode[]>([]);

  const declare = useMemo(
    () => ({
      set(node: CardSpecNode) {
        setDeclared((current) => {
          const index = current.findIndex(({ id }) => id === node.id);

          if (index === -1) return [...current, node];
          if (current[index].props.name === node.props.name) return current;

          return current.map((field, i) => (i === index ? node : field));
        });
      },
      remove(id: string) {
        setDeclared((current) => current.filter((field) => field.id !== id));
      },
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

  const customFields = useRef(new Map<string, DeclaredCustomField>());
  const rulesKeys = useRef(new Map<string, string>());
  const emitChange = useRef<() => void>(() => {});

  // A field declared or dropped changes the payload without a value changing.
  const customFieldsContext = useMemo<CustomFieldsContextValue>(
    () => ({
      set(id, name, rules) {
        const fields = customFields.current;

        if (fields.get(id)?.name !== name && name.includes(".")) {
          console.warn(unreportableFieldName(name));
        }

        fields.set(id, { name, rules });

        // A value typed under other rules is dropped, with its error. This is
        // for security: otherwise the app could keep changing the pattern to
        // work out what was typed.
        const key = validationRulesKey(checkedRules(rules));
        const previous = rulesKeys.current.get(name);
        rulesKeys.current.set(name, key);

        if (previous !== undefined && previous !== key) {
          methods.resetField(`fields.${name}` as keyof CardFormValues, {
            defaultValue: "",
          });
        }

        emitChange.current();
      },
      remove(id) {
        const field = customFields.current.get(id);
        if (field) rulesKeys.current.delete(field.name);

        customFields.current.delete(id);
        emitChange.current();
      },
    }),
    []
  );

  // A field showing an error is checked again under its new settings.
  const fieldSettingsContext = useMemo<CardFieldSettingsContextValue>(
    () => ({
      set(id, field, settings) {
        fieldSettings.current.set(id, { field, settings });
        if (methods.getFieldState(field).error) void methods.trigger(field);
        emitChange.current();
      },
      remove(id) {
        fieldSettings.current.delete(id);
        emitChange.current();
      },
    }),
    []
  );

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
            customFields: rulesByName(customFields.current),
            fieldSettings: settingsByField(fieldSettings.current),
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

  // The security code is judged against the number, so it is checked again
  // once it has been left or shows an error.
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
        },
      }),
      []
    )
  );

  return (
    <FormProvider {...methods}>
      <EvervaultInputContext.Provider value={inputContext}>
        <DeclaredFieldsContext.Provider value={declaredFieldsContext}>
          <CustomFieldsContext.Provider value={customFieldsContext}>
            <CardFieldSettingsContext.Provider value={fieldSettingsContext}>
              <FocusOrderContext.Provider value={focusOrder}>
                {children}
              </FocusOrderContext.Provider>
            </CardFieldSettingsContext.Provider>
          </CustomFieldsContext.Provider>
        </DeclaredFieldsContext.Provider>
      </EvervaultInputContext.Provider>
    </FormProvider>
  );
});
