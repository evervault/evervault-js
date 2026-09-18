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
} from "react";
import type { ReactElement } from "react";
import { useForm, useTranslations } from "shared";
import { Error } from "../Common/Error";
import { Field } from "../Common/Field";
import { Tooltip } from "../Common/Tooltip";
import { resize } from "../utilities/resize";
import { useMessaging } from "../utilities/useMessaging";
import { BrandIcon } from "./BrandIcon";
import { CardCVC } from "./CardCVC";
import { CardExpiry } from "./CardExpiry";
import { CardHolder } from "./CardHolder";
import { CardNumber } from "./CardNumber";
import { DEFAULT_TRANSLATIONS } from "./translations";
import { useCardReader } from "./useCardReader";
import { isSpec, legacyNodes } from "./legacyFields";
import { declaredProps, fieldProps } from "./props";
import { declaredFields, fieldFor, useSpec } from "./useSpec";
import { useFocusOrder } from "./useFocusOrder";
import {
  changePayload,
  collectIcons,
  isBrandSupported,
  swipePayload,
} from "./utilities";
import type { CardForm, CardConfig } from "./types";
import type {
  CardField,
  CardSpecNode,
  CardFrameClientMessages,
  CardFrameHostMessages,
} from "types";

// Nodes re-declaring a field claimed earlier in the tree: the first wins.
function duplicateNodes(nodes: CardSpecNode[]): CardSpecNode[] {
  const rendered = new Set<CardField>();

  const walk = (node: CardSpecNode): CardSpecNode[] => {
    if (node.type === "row") return (node.children ?? []).flatMap(walk);

    const field = fieldFor(node.type);

    if (!field) return [];
    if (rendered.has(field)) return [node];

    rendered.add(field);
    return [];
  };

  return nodes.flatMap(walk);
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
  const declaredTree = isSpec(config.fields);

  const seed = useMemo(
    () => (isSpec(config.fields) ? config.fields : legacyNodes(config)),
    [config]
  );

  const nodes = useSpec(on, seed);
  const fields = useMemo(() => declaredFields(nodes), [nodes]);
  const duplicates = useMemo(() => duplicateNodes(nodes), [nodes]);
  const declared = useMemo(() => declaredProps(nodes), [nodes]);

  const cvcOptional =
    declared.get("cvc")?.optional ?? config.validation?.cvc?.optional;

  // Declaring where focus goes, or that it goes nowhere, retires
  // `config.autoFocus`.
  const declaresAutoFocus = useMemo(
    () => [...declared].some(([, props]) => props.autoFocus !== undefined),
    [declared]
  );

  const autoFocusField = useMemo(
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

    if (autoFocusField) {
      autoFocusing.current = true;
      document.getElementById(autoFocusField)?.focus();
      autoFocusing.current = false;
      return;
    }

    if (!declaresAutoFocus) return;

    const active = document.activeElement;

    if (
      active instanceof HTMLElement &&
      fields.includes(active.id as CardField)
    ) {
      active.blur();
    }
  }, [autoFocusField, declaresAutoFocus, fields]);

  // In an effect, not the render body, so a re-render does not warn again.
  const warned = useRef("");

  useEffect(() => {
    const key = duplicates.map((node) => node.id).join(",");

    if (key === warned.current) return;
    warned.current = key;

    duplicates.forEach((node) => {
      console.warn(`<ev-card> ignored a duplicate "${node.type}" field.`);
    });
  }, [duplicates]);

  const form = useForm<CardForm>({
    initialValues: {
      cvc: "",
      expiry: "",
      number: "",
      name: config.defaultValues?.name ?? "",
    },
    validate: {
      name: (values) => {
        if (!fields.includes("name")) return undefined;

        if (values.name.length === 0) {
          return "invalid";
        }

        // Check custom regex validation if provided
        if (config.validation?.name?.regex) {
          if (!config.validation.name.regex.test(values.name)) {
            return "regex";
          }
        }

        return undefined;
      },
      number: (values) => {
        if (!fields.includes("number")) return undefined;

        const cardValidation = validateNumber(values.number, { customBrands });
        if (!cardValidation.isValid) {
          return "invalid";
        }

        if (
          !isBrandSupported(cardValidation, { acceptedBrands, customBrands })
        ) {
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

        const allow3DigitAmex = config.allow3DigitAmexCVC ?? true;
        const isAmex = cardValidation.brand === "american-express";
        if (isAmex && values.cvc?.length === 3 && !allow3DigitAmex) {
          return "invalid";
        }

        return undefined;
      },
    },
    onChange: (formState) => {
      const triggerChange = async () => {
        if (!ev) return;
        const cardData = await changePayload(ev, formState, fields, {
          allow3DigitAmexCVC: config.allow3DigitAmexCVC,
          cvcOptional,
          customBrands,
        });

        if (cardData.isComplete) {
          send("EV_COMPLETE", cardData);
        }

        send("EV_CHANGE", cardData);
      };

      void triggerChange();
    },
  });

  const cardReaderListening = useCardReader((card) => {
    form.setValues({
      name: `${card.firstName} ${card.lastName}`,
      number: card.number,
      expiry: `${card.month}/${card.year}`,
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

  useLayoutEffect(() => {
    resize();
  });

  useEffect(
    () =>
      on("EV_VALIDATE", () => {
        if (!ev) return;

        form.validate((formState) => {
          void (async () => {
            const data = await changePayload(ev, formState, fields, {
              allow3DigitAmexCVC: config.allow3DigitAmexCVC,
              cvcOptional,
              customBrands,
            });
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
      config.allow3DigitAmexCVC,
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

  const focus = useFocusOrder(fields);

  const advanceFromNumber = useCallback(() => {
    focus.next("number");
  }, [focus]);

  const advanceFromExpiry = useCallback(() => {
    focus.next("expiry");
  }, [focus]);

  const advanceFromCVC = useCallback(() => {
    focus.next("cvc");
  }, [focus]);

  const hasErrors = Object.keys(form.errors ?? {}).length > 0;

  const handleFocus = (field: CardField) => () => {
    if (!autoFocusing.current) interacted.current = true;

    send("EV_FOCUS", field);
  };

  const handleBlur = (field: CardField) => () => {
    send("EV_BLUR", field);
  };

  const handleKeyDown =
    (field: CardField) => (event: React.KeyboardEvent<HTMLInputElement>) => {
      interacted.current = true;

      send("EV_KEYDOWN", field);

      // At keydown the value is still there, so empty means nothing to erase.
      if (
        config.autoProgress &&
        event.key === "Backspace" &&
        event.currentTarget.value.length === 0
      ) {
        // Uncancelled, the deletion lands on the field just stepped back to.
        if (focus.previous(field)) {
          event.preventDefault();
        }
      }
    };

  const handleKeyUp = (field: CardField) => () => {
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

    const field = fieldFor(node.type);

    if (!field) {
      console.warn(`<ev-card> cannot render a "${node.type}" field yet.`);
      return null;
    }

    if (duplicates.includes(node)) return null;

    const props = fieldProps(node);

    if (field === "name") {
      return (
        <Field
          key={node.id}
          name="name"
          hasValue={form.values.name.length > 0}
          error={form.errors?.name && t(`name.errors.${form.errors.name}`)}
        >
          <label htmlFor="name">{props.label ?? t("name.label")}</label>
          {props.tooltip && <Tooltip>{props.tooltip}</Tooltip>}
          <CardHolder
            disabled={!config}
            readOnly={cardReaderListening}
            autoFocus={declaresAutoFocus ? false : config.autoFocus}
            placeholder={props.placeholder ?? t("name.placeholder")}
            value={form.values.name}
            autoComplete={
              props.autoComplete ?? config.autoComplete?.name ?? true
            }
            onFocus={handleFocus("name")}
            onKeyUp={handleKeyUp("name")}
            onKeyDown={handleKeyDown("name")}
            {...form.register("name", {
              onBlur: handleBlur("name"),
            })}
          />
          {form.errors?.name && (
            <Error>{t(`name.errors.${form.errors.name}`)}</Error>
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
          error={
            form.errors?.number && t(`number.errors.${form.errors.number}`)
          }
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
            autoComplete={
              props.autoComplete ?? config.autoComplete?.number ?? true
            }
            autoProgress={config.autoProgress}
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
            <Error>{t(`number.errors.${form.errors.number}`)}</Error>
          )}
        </Field>
      );
    }

    if (field === "expiry") {
      return (
        <Field
          key={node.id}
          name="expiry"
          hasValue={form.values.expiry.length > 0}
          error={
            form.errors?.expiry && t(`expiry.errors.${form.errors.expiry}`)
          }
        >
          <label htmlFor="expiry">{props.label ?? t("expiry.label")}</label>
          {props.tooltip && <Tooltip>{props.tooltip}</Tooltip>}
          <CardExpiry
            value={form.values.expiry}
            disabled={!config}
            readOnly={cardReaderListening}
            placeholder={props.placeholder ?? t("expiry.placeholder")}
            autoComplete={
              props.autoComplete ?? config.autoComplete?.expiry ?? true
            }
            autoProgress={config.autoProgress}
            onComplete={advanceFromExpiry}
            onFocus={handleFocus("expiry")}
            onKeyUp={handleKeyUp("expiry")}
            onKeyDown={handleKeyDown("expiry")}
            {...form.register("expiry", {
              onBlur: handleBlur("expiry"),
            })}
          />
          {form.errors?.expiry && (
            <Error>{t(`expiry.errors.${form.errors.expiry}`)}</Error>
          )}
        </Field>
      );
    }

    return (
      <Field
        key={node.id}
        name="cvc"
        hasValue={form.values.cvc.length > 0}
        error={form.errors?.cvc && t(`cvc.errors.${form.errors.cvc}`)}
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
          autoComplete={props.autoComplete ?? config.autoComplete?.cvc ?? true}
          autoProgress={config.autoProgress}
          onComplete={advanceFromCVC}
          redact={props.redact ?? config.redactCVC}
          customBrands={customBrands}
          {...form.register("cvc", {
            onBlur: handleBlur("cvc"),
          })}
        />
        {form.errors?.cvc && (
          <Error>{t(`cvc.errors.${form.errors.cvc}`)}</Error>
        )}
      </Field>
    );
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
