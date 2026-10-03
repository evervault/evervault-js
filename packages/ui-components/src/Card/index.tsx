import {
  validateNumber,
  validateCVC,
  validateExpiry,
} from "@evervault/card-validator";
import { useEvervault } from "@evervault/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FocusEvent, ReactElement } from "react";
import {
  compilePattern,
  customFieldInputId,
  isRefusedAmexCvc,
  skippedNodes,
  useForm,
  useTranslations,
} from "shared";
import type { UseFormReturn } from "shared";
import { Error } from "../Common/Error";
import { Field } from "../Common/Field";
import { Tooltip } from "../Common/Tooltip";
import { resize } from "../utilities/resize";
import { useMessaging } from "../utilities/useMessaging";
import { BrandIcon } from "./BrandIcon";
import { CardCVC } from "./CardCVC";
import { CardExpiry } from "./CardExpiry";
import { CardExpiryHalf } from "./CardExpiryHalf";
import { CardHolder } from "./CardHolder";
import { CardNumber } from "./CardNumber";
import { CustomFieldInput } from "./CustomFieldInput";
import {
  customFieldNodes,
  customFieldProps,
  customFieldWarnings,
} from "./customField";
import { settingForInput, applyCardSettingsToFields } from "./fieldSettings";
import { DEFAULT_TRANSLATIONS } from "./translations";
import { useAgentTools } from "./useAgentTools";
import { useCardReader } from "./useCardReader";
import { skippedFieldWarning } from "./developerMessages";
import { declaredExpiry, expiryError, joinExpiry, splitExpiry } from "./expiry";
import type { ExpiryHalves } from "./expiry";
import { isSpec, legacyNodes } from "./legacyFields";
import { declaredProps, fieldProps } from "./props";
import type { FieldProps } from "./props";
import { declaredFields, declaredInputs, useSpec } from "./useSpec";
import { useCustomFields } from "./useCustomFields";
import { useFocusOrder } from "./useFocusOrder";
import {
  changePayload,
  collectIcons,
  customComplete,
  isBrandSupported,
  swipePayload,
} from "./utilities";
import type { CardFormValidators } from "./agentTools";
import type { CardForm, CardConfig, CardInput } from "./types";
import type {
  CardSpecNode,
  CardFrameClientMessages,
  CardFrameHostMessages,
  FieldTarget,
} from "types";

function inputOf(target: FieldTarget): CardInput {
  return typeof target === "string" ? target : customFieldInputId(target.name);
}

export function Card({ config }: { config: CardConfig }) {
  const cvc = useRef<HTMLInputElement | null>(null);
  const { on, send } = useMessaging<
    CardFrameHostMessages,
    CardFrameClientMessages
  >();

  const ev = useEvervault();
  const { t } = useTranslations(DEFAULT_TRANSLATIONS, config?.translations);

  const { acceptedBrands, customBrands } = config;

  // Everything past here reads the tree: the host's `fields` become one at the
  // boundary, whichever shape they arrived in.
  const declaredTree = isSpec(config.fields) ? config.fields : null;

  const seed = useMemo(
    () => declaredTree ?? legacyNodes(config),
    [declaredTree, config]
  );

  const received = useSpec(on, seed);
  const refusal = useMemo(() => expiryError(received), [received]);

  // A refused tree leaves the card on the last one it could render.
  const [renderable, setRenderable] = useState(refusal ? [] : received);

  if (!refusal && renderable !== received) {
    setRenderable(received);
  }

  const nodes = useMemo(
    () => applyCardSettingsToFields(refusal ? renderable : received, config),
    [refusal, renderable, received, config]
  );

  useEffect(() => {
    if (refusal) console.error(refusal);
  }, [refusal]);

  const inputs = useMemo(() => declaredInputs(nodes), [nodes]);
  const fields = useMemo(() => declaredFields(nodes), [nodes]);
  const skipped = useMemo(() => skippedNodes(nodes), [nodes]);
  const declared = useMemo(() => declaredProps(nodes), [nodes]);
  const expiry = useMemo(() => declaredExpiry(nodes), [nodes]);

  const cvcOptional =
    declared.get("cvc")?.optional ?? config.validation?.cvc?.optional;

  const allow3DigitAmexCVC =
    declared.get("cvc")?.allow3DigitAmex ?? config.allow3DigitAmexCVC;

  // An invalid pattern on the holder is as good as none.
  const holderPattern = declared.get("name")?.pattern;
  const nameRegex =
    (holderPattern === undefined ? undefined : compilePattern(holderPattern)) ??
    config.validation?.name?.regex;

  const autoProgressOf = (input: CardInput) =>
    declared.get(input)?.autoProgress ??
    settingForInput(config.autoProgress, input) ??
    false;

  const autoCompleteOf = (input: CardInput, props: FieldProps) =>
    props.autoComplete ?? settingForInput(config.autoComplete, input) ?? true;

  const errorText = (
    props: FieldProps,
    field: string,
    code: string | undefined
  ) => {
    if (!code) return undefined;

    const declaredText =
      code === "unsupportedBrand"
        ? props.unsupportedBrandMessage
        : props.errorMessage;

    return declaredText ?? t(`${field}.errors.${code}`);
  };

  // Declaring where focus goes, or that it goes nowhere, retires
  // `config.autoFocus`.
  const declaresAutoFocus = useMemo(
    () => [...declared].some(([, props]) => props.autoFocus !== undefined),
    [declared]
  );

  const autoFocusInput = useMemo(
    () => [...declared].find(([, props]) => props.autoFocus)?.[0],
    [declared]
  );

  const interacted = useRef(false);

  // Focus the card places itself is not the customer taking over: at mount
  // that is `config.autoFocus`, afterwards the effect below.
  const autoFocusing = useRef(true);

  useEffect(() => {
    autoFocusing.current = false;
  }, []);

  // Focus follows the declaration until the customer touches the card, and a
  // declaration sending it nowhere takes back what the config gave.
  useEffect(() => {
    if (interacted.current) return;

    if (autoFocusInput) {
      autoFocusing.current = true;
      document.getElementById(autoFocusInput)?.focus();
      autoFocusing.current = false;
      return;
    }

    if (!declaresAutoFocus) return;

    const active = document.activeElement;

    if (
      active instanceof HTMLElement &&
      inputs.includes(active.id as CardInput)
    ) {
      active.blur();
    }
  }, [autoFocusInput, declaresAutoFocus, inputs]);

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

  const validators: CardFormValidators = {
    name: (values) => {
      if (!fields.includes("name")) return undefined;

      if (values.name.length === 0) {
        return "invalid";
      }

      if (nameRegex && !nameRegex.test(values.name)) {
        return "regex";
      }

      return undefined;
    },
    number: (values) => {
      if (!fields.includes("number")) return undefined;

      const cardValidation = validateNumber(values.number, { customBrands });
      if (!cardValidation.isValid) {
        return "invalid";
      }

      if (!isBrandSupported(cardValidation, { acceptedBrands, customBrands })) {
        return "unsupportedBrand";
      }

      return undefined;
    },
    expiry: (values) => {
      if (!fields.includes("expiry")) return undefined;

      const expiryValidation = validateExpiry(values.expiry);
      if (!expiryValidation.isValid) {
        return "invalid";
      }

      return undefined;
    },
    cvc: (values) => {
      if (!fields.includes("cvc")) return undefined;
      if (cvcOptional && values.cvc.length === 0) return undefined;

      const cardValidation = validateNumber(values.number, { customBrands });
      const cvcValidation = validateCVC(values.cvc, values.number, {
        customBrands,
      });

      if (!cvcValidation.isValid) {
        return "invalid";
      }

      if (
        isRefusedAmexCvc(values.cvc, cardValidation.brand, allow3DigitAmexCVC)
      ) {
        return "invalid";
      }

      return undefined;
    },
  };

  const form = useForm<CardForm>({
    initialValues: {
      cvc: "",
      expiry: "",
      number: "",
      name: config.defaultValues?.name ?? "",
    },
    validate: validators,
    onChange: (formState) => sendChange(formState),
  });

  const customFields = useCustomFields(nodes, () => sendChange(form));

  // Only called after a render, once `customFields` exists.
  function sendChange(formState: UseFormReturn<CardForm>) {
    const triggerChange = async () => {
      if (!ev) return;
      const cardData = await changePayload(
        ev,
        formState,
        fields,
        customFields,
        {
          allow3DigitAmexCVC,
          cvcOptional,
          customBrands,
        }
      );

      if (cardData.isComplete) {
        send("EV_COMPLETE", cardData);
      }

      send("EV_CHANGE", cardData);
    };

    void triggerChange();
  }

  // What the shopper typed in each half. A year typed before the month
  // isn't part of the form's date yet, so it's kept here.
  const [storedHalves, setStoredHalves] = useState(() =>
    splitExpiry(form.values.expiry)
  );
  const split = expiry?.form === "split";

  let expiryHalves = storedHalves;

  // Something else changed the date, such as the card reader, so split it again.
  if (split && joinExpiry(storedHalves) !== form.values.expiry) {
    expiryHalves = splitExpiry(form.values.expiry);
    setStoredHalves(expiryHalves);
  }

  const changeExpiryHalf = (half: keyof ExpiryHalves) => (value: string) => {
    const halves = { ...expiryHalves, [half]: value };
    setStoredHalves(halves);
    form.setValue("expiry", joinExpiry(halves));
  };

  const cardReaderListening = useCardReader((card) => {
    form.setValues({
      name: `${card.firstName} ${card.lastName}`,
      number: card.number,
      expiry: split
        ? `${card.month}${card.year}`
        : `${card.month}/${card.year}`,
      cvc: "",
    });

    async function triggerSwipe() {
      if (!ev) return;
      const swipeData = await swipePayload(ev, card);
      send("EV_SWIPE", swipeData);
    }

    cvc.current?.focus();
    void triggerSwipe();
  });

  useAgentTools({
    config: config.agentTools,
    fields,
    inputs,
    form,
    validators,
    t,
    customFieldsComplete: customComplete(customFields),
  });

  useLayoutEffect(() => {
    resize();
  });

  useEffect(
    () =>
      on("EV_VALIDATE", () => {
        if (!ev) return;

        const errors = customFields.validate();

        form.validate((formState) => {
          void (async () => {
            const data = await changePayload(
              ev,
              formState,
              fields,
              { ...customFields, errors },
              {
                allow3DigitAmexCVC,
                cvcOptional,
                customBrands,
              }
            );
            send("EV_VALIDATED", data);
          })();
        });
      }),
    [
      ev,
      on,
      send,
      form,
      fields,
      customFields,
      allow3DigitAmexCVC,
      cvcOptional,
      customBrands,
    ]
  );

  useEffect(
    () =>
      on("EV_UPDATE_NAME", (name) => {
        form.setValue("name", name);
      }),
    [on, form]
  );

  const appliedDefaultName = useRef(config.defaultValues?.name);

  // A default seeds the field: it applies while the name is still the card's
  // own, and seeding it is not a change the customer made.
  useEffect(() => {
    const defaultName = declared.get("name")?.defaultValue;

    if (defaultName === undefined || defaultName === appliedDefaultName.current)
      return;

    const seeded =
      form.values.name.length === 0 ||
      form.values.name === appliedDefaultName.current;

    if (!seeded) return;

    appliedDefaultName.current = defaultName;
    form.setValues((values) => ({ ...values, name: defaultName }));
  }, [declared, form]);

  const focus = useFocusOrder(inputs);

  const advanceFromNumber = useCallback(() => {
    focus.next("number");
  }, [focus]);

  const advanceFromExpiry = useCallback(() => {
    focus.next("expiry");
  }, [focus]);

  const advanceFromExpiryMonth = useCallback(() => {
    focus.next("expiry-month");
  }, [focus]);

  const advanceFromExpiryYear = useCallback(() => {
    focus.next("expiry-year");
  }, [focus]);

  const advanceFromCVC = useCallback(() => {
    focus.next("cvc");
  }, [focus]);

  const hasErrors =
    Object.keys(form.errors ?? {}).length > 0 || customFields.errors.size > 0;

  const handleFocus = (field: FieldTarget) => () => {
    if (!autoFocusing.current) interacted.current = true;

    send("EV_FOCUS", field);
  };

  const handleBlur = (field: FieldTarget) => () => {
    send("EV_BLUR", field);
  };

  // The host hears about fields; focus moves between inputs.
  const handleKeyDown =
    (field: FieldTarget, input: CardInput = inputOf(field)) =>
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      interacted.current = true;

      send("EV_KEYDOWN", field);

      // At keydown the value is still there, so empty means nothing to erase.
      if (
        autoProgressOf(input) &&
        event.key === "Backspace" &&
        event.currentTarget.value.length === 0
      ) {
        // Uncancelled, the deletion lands on the field just stepped back to.
        if (focus.previous(input)) {
          event.preventDefault();
        }
      }
    };

  const handleKeyUp = (field: FieldTarget) => () => {
    send("EV_KEYUP", field);
  };

  const renderNode = (node: CardSpecNode): ReactElement | null => {
    if (node.type === "row") {
      const children = (node.children ?? [])
        .map(renderNode)
        .filter((child) => child !== null);

      // An empty wrapper would still take its own track in the card grid.
      if (children.length === 0) return null;

      return (
        <div key={node.id} ev-row="">
          {children}
        </div>
      );
    }

    if (skipped.includes(node)) return null;

    if (node.type === "field") {
      const declared = customFieldProps(node);

      if (!declared) return null;

      const { name } = declared;
      const id = customFieldInputId(name);
      const target = { field: "field", name } as const;
      const value = customFields.valueOf(name);
      const code = customFields.errors.get(name);
      const error =
        code &&
        (declared.errorMessage ??
          config.translations?.fields?.[name]?.errors?.[code] ??
          t(`field.errors.${code}`));

      return (
        <Field
          key={node.id}
          name={id}
          hasValue={value.length > 0}
          error={error}
        >
          {declared.label && <label htmlFor={id}>{declared.label}</label>}
          {declared.tooltip && <Tooltip>{declared.tooltip}</Tooltip>}
          <CustomFieldInput
            id={id}
            field={declared}
            value={value}
            disabled={!config}
            onChange={(next) => {
              customFields.setValue(name, next);

              // A field with no set length has no point at which it is done.
              const full =
                declared.maxLength !== undefined &&
                next.length >= declared.maxLength;

              if (declared.autoProgress && full) focus.next(id);
            }}
            onFocus={handleFocus(target)}
            onBlur={() => {
              customFields.blur(name);
              handleBlur(target)();
            }}
            onKeyUp={handleKeyUp(target)}
            onKeyDown={handleKeyDown(target)}
          />
          {error && <Error>{error}</Error>}
        </Field>
      );
    }

    const field = node.type;

    const props = fieldProps(node);

    if (field === "name") {
      return (
        <Field
          key={node.id}
          name="name"
          hasValue={form.values.name.length > 0}
          error={errorText(props, "name", form.errors?.name)}
        >
          <label htmlFor="name">{props.label ?? t("name.label")}</label>
          {props.tooltip && <Tooltip>{props.tooltip}</Tooltip>}
          <CardHolder
            disabled={!config}
            readOnly={cardReaderListening}
            autoFocus={declaresAutoFocus ? false : config.autoFocus}
            placeholder={props.placeholder ?? t("name.placeholder")}
            value={form.values.name}
            autoComplete={autoCompleteOf("name", props)}
            onFocus={handleFocus("name")}
            onKeyUp={handleKeyUp("name")}
            onKeyDown={handleKeyDown("name")}
            {...form.register("name", {
              onBlur: handleBlur("name"),
            })}
          />
          {form.errors?.name && (
            <Error>{errorText(props, "name", form.errors.name)}</Error>
          )}
        </Field>
      );
    }

    if (field === "number") {
      return (
        <Field
          key={node.id}
          name="number"
          iconPosition={props.iconPosition}
          hasValue={form.values.number.length > 0}
          error={errorText(props, "number", form.errors?.number)}
        >
          <label htmlFor="number">{props.label ?? t("number.label")}</label>
          {props.tooltip && <Tooltip>{props.tooltip}</Tooltip>}

          {config.icons && (
            <BrandIcon
              icons={collectIcons(config.icons)}
              number={form.values.number}
              customBrands={customBrands}
            />
          )}

          <CardNumber
            disabled={!config}
            readOnly={cardReaderListening}
            autoFocus={declaresAutoFocus ? false : config.autoFocus}
            placeholder={props.placeholder ?? t("number.placeholder")}
            value={form.values.number}
            autoComplete={autoCompleteOf("number", props)}
            autoProgress={autoProgressOf("number")}
            onComplete={advanceFromNumber}
            form={form}
            customBrands={customBrands}
            onFocus={handleFocus("number")}
            onKeyUp={handleKeyUp("number")}
            onKeyDown={handleKeyDown("number")}
            {...form.register("number", {
              onBlur: handleBlur("number"),
            })}
          />
          {form.errors?.number && (
            <Error>{errorText(props, "number", form.errors.number)}</Error>
          )}
        </Field>
      );
    }

    if (node.type === "expiryMonth" || node.type === "expiryYear") {
      const half = node.type === "expiryMonth" ? "month" : "year";
      const otherHalf = half === "month" ? "year" : "month";
      const later = expiry?.form === "split" && expiry.later === node.type;
      // The halves share one error; either may declare its text.
      const error = errorText(
        {
          errorMessage:
            props.errorMessage ??
            declared.get(`expiry-${otherPart}`)?.errorMessage,
        },
        "expiry",
        form.errors?.expiry
      );
      const registered = form.register("expiry", {
        onBlur: handleBlur("expiry"),
      });

      // Tabbing into the other half while it's empty isn't finishing the date.
      const onBlur = (event: FocusEvent<HTMLInputElement>) => {
        const startingOtherHalf =
          event.relatedTarget?.id === `expiry-${otherHalf}` &&
          expiryHalves[otherHalf] === "";

        if (startingOtherHalf) {
          // Only fires the card's `blur` event.
          handleBlur("expiry")();
        } else {
          // Fires the card's `blur` event + checks the date, showing its error if invalid.
          registered.onBlur(event);
        }
      };

      return (
        <Field
          key={node.id}
          name={`expiry-${half}`}
          hasValue={expiryHalves[half].length > 0}
          error={error}
        >
          <label htmlFor={`expiry-${half}`}>
            {props.label ?? t(`${node.type}.label`)}
          </label>
          {props.tooltip && <Tooltip>{props.tooltip}</Tooltip>}
          <CardExpiryHalf
            half={half}
            value={expiryHalves[half]}
            disabled={!config}
            readOnly={cardReaderListening}
            placeholder={props.placeholder ?? t(`${node.type}.placeholder`)}
            autoComplete={autoCompleteOf(`expiry-${part}`, props)}
            autoProgress={autoProgressOf(`expiry-${part}`)}
            onComplete={
              half === "month" ? advanceFromExpiryMonth : advanceFromExpiryYear
            }
            onChange={changeExpiryHalf(half)}
            onBlur={onBlur}
            onFocus={handleFocus("expiry")}
            onKeyUp={handleKeyUp("expiry")}
            onKeyDown={handleKeyDown("expiry", `expiry-${half}`)}
          />
          {later && error && <Error>{error}</Error>}
        </Field>
      );
    }

    if (field === "expiry") {
      return (
        <Field
          key={node.id}
          name="expiry"
          hasValue={form.values.expiry.length > 0}
          error={errorText(props, "expiry", form.errors?.expiry)}
        >
          <label htmlFor="expiry">{props.label ?? t("expiry.label")}</label>
          {props.tooltip && <Tooltip>{props.tooltip}</Tooltip>}
          <CardExpiry
            value={form.values.expiry}
            disabled={!config}
            readOnly={cardReaderListening}
            placeholder={props.placeholder ?? t("expiry.placeholder")}
            autoComplete={autoCompleteOf("expiry", props)}
            autoProgress={autoProgressOf("expiry")}
            onComplete={advanceFromExpiry}
            onFocus={handleFocus("expiry")}
            onKeyUp={handleKeyUp("expiry")}
            onKeyDown={handleKeyDown("expiry")}
            {...form.register("expiry", {
              onBlur: handleBlur("expiry"),
            })}
          />
          {form.errors?.expiry && (
            <Error>{errorText(props, "expiry", form.errors.expiry)}</Error>
          )}
        </Field>
      );
    }

    if (field === "cvc") {
      return (
        <Field
          key={node.id}
          name="cvc"
          hasValue={form.values.cvc.length > 0}
          error={errorText(props, "cvc", form.errors?.cvc)}
        >
          <label htmlFor="cvc">{props.label ?? t("cvc.label")}</label>
          {props.tooltip && <Tooltip>{props.tooltip}</Tooltip>}
          <CardCVC
            ref={cvc}
            value={form.values.cvc}
            disabled={!config}
            cardNumber={form.values.number}
            readOnly={cardReaderListening}
            placeholder={props.placeholder ?? t("cvc.placeholder")}
            onFocus={handleFocus("cvc")}
            onKeyUp={handleKeyUp("cvc")}
            onKeyDown={handleKeyDown("cvc")}
            autoComplete={autoCompleteOf("cvc", props)}
            autoProgress={autoProgressOf("cvc")}
            onComplete={advanceFromCVC}
            redact={props.redact ?? config.redactCVC}
            customBrands={customBrands}
            {...form.register("cvc", {
              onBlur: handleBlur("cvc"),
            })}
          />
          {form.errors?.cvc && (
            <Error>{errorText(props, "cvc", form.errors.cvc)}</Error>
          )}
        </Field>
      );
    }

    return null;
  };

  return (
    <fieldset
      ev-component="card"
      ev-valid={hasErrors ? "false" : "true"}
      ev-fields={fields}
      // A field list says nothing about layout, so the card lays it out; a
      // declared tree is laid out exactly as written.
      ev-layout={declaredTree ? undefined : "auto"}
    >
      {nodes.map(renderNode)}
    </fieldset>
  );
}
