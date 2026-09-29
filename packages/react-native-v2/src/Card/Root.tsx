import {
  forwardRef,
  PropsWithChildren,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
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
  CustomFieldsContext,
  CustomFieldsContextValue,
  DeclaredCustomField,
  rulesByName,
} from "./customFields";
import {
  CardFieldSettings,
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
        targets[targets.indexOf(target) + 1]?.focus();
      },
    }),
    []
  );

  const customFields = useRef(new Map<string, DeclaredCustomField>());
  const emitChange = useRef<() => void>(() => {});

  // A field declared or dropped changes the payload without a value changing.
  const customFieldsContext = useMemo<CustomFieldsContextValue>(
    () => ({
      set(id, name, rules) {
        customFields.current.set(id, { name, rules });
        emitChange.current();
      },
      remove(id) {
        customFields.current.delete(id);
        emitChange.current();
      },
    }),
    []
  );

  const fieldSettingsContext = useMemo<CardFieldSettingsContextValue>(
    () => ({
      register(id, field, settings) {
        fieldSettings.current.set(id, { field, settings });
        emitChange.current();

        return () => {
          fieldSettings.current.delete(id);
          emitChange.current();
        };
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
        <CustomFieldsContext.Provider value={customFieldsContext}>
          <CardFieldSettingsContext.Provider value={fieldSettingsContext}>
            <FocusOrderContext.Provider value={focusOrder}>
              {children}
            </FocusOrderContext.Provider>
          </CardFieldSettingsContext.Provider>
        </CustomFieldsContext.Provider>
      </EvervaultInputContext.Provider>
    </FormProvider>
  );
});
