import { useEvervault } from "@evervault/react";
import cardValidator from "card-validator";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Error } from "../Common/Error";
import { Field } from "../Common/Field";
import { resize } from "../utilities/resize";
import { useForm } from "../utilities/useForm";
import { useMessaging } from "../utilities/useMessaging";
import { useTranslations } from "../utilities/useTranslations";
import { CardCVC } from "./CardCVC";
import { CardExpiry } from "./CardExpiry";
import { CardHolder } from "./CardHolder";
import { CardNumber } from "./CardNumber";
import { DEFAULT_TRANSLATIONS } from "./translations";
import { useCardReader } from "./useCardReader";
import { changePayload, isCVCValid, swipePayload } from "./utilities";
import type { CardForm, CardConfig } from "./types";
import type { CardFrameClientMessages, CardFrameHostMessages } from "types";

export function Card({ config }: { config: CardConfig }) {
  const cvc = useRef<HTMLInputElement | null>(null);
  const { on, send } = useMessaging<
    CardFrameHostMessages,
    CardFrameClientMessages
  >();
  const ev = useEvervault();
  const { t } = useTranslations(DEFAULT_TRANSLATIONS, config?.translations);

  const fields = useMemo(() => {
    let result = config.fields ?? ["number", "expiry", "cvc"];
    const hidden = String(config?.hiddenFields ?? "").split(",");

    if (hidden.length > 0) {
      result = result.filter((field) => !hidden?.includes(field));
    }

    return result;
  }, [config]);

  const form = useForm<CardForm>({
    initialValues: {
      cvc: "",
      expiry: "",
      number: "",
      name: "",
    },
    validate: {
      name: (values) => {
        if (!fields.includes("name")) return undefined;

        if (values.name.length === 0) {
          return "invalid";
        }

        return undefined;
      },
      number: (values) => {
        if (!fields.includes("number")) return undefined;

        const cardValidation = cardValidator.number(values.number);
        if (!cardValidation.isValid) {
          return "invalid";
        }

        return undefined;
      },
      expiry: (values) => {
        if (!fields.includes("expiry")) return undefined;

        const expiry = cardValidator.expirationDate(values.expiry);
        if (!expiry.isValid) {
          return "invalid";
        }

        return undefined;
      },
      cvc: (values) => {
        if (!fields.includes("cvc")) return undefined;

        const cardValidation = cardValidator.number(values.number);
        const validCVC = isCVCValid(values.cvc, cardValidation.card?.type);
        if (!validCVC) {
          return "invalid";
        }

        return undefined;
      },
    },
    onChange: (formState) => {
      const triggerChange = async () => {
        if (!ev) return;
        const cardData = await changePayload(ev, formState, fields);

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
        form.validate();
      }),
    [on, form]
  );

  const hasErrors = Object.keys(form.errors ?? {}).length > 0;

  return (
    <fieldset
      ev-component="card"
      ev-valid={hasErrors ? "false" : "true"}
      ev-fields={fields}
    >
      {fields.includes("name") && (
        <Field
          name="name"
          hasValue={form.values.name.length > 0}
          error={form.errors?.name && t(`name.errors.${form.errors.name}`)}
        >
          <label htmlFor="name">{t("name.label")}</label>
          <CardHolder
            disabled={!config}
            readOnly={cardReaderListening}
            autoFocus={config.autoFocus}
            placeholder={t("name.placeholder")}
            value={form.values.name}
            {...form.register("name")}
          />
          {form.errors?.name && (
            <Error>{t(`name.errors.${form.errors.name}`)}</Error>
          )}
        </Field>
      )}

      {fields.includes("number") && (
        <Field
          name="number"
          hasValue={form.values.number.length > 0}
          error={
            form.errors?.number && t(`number.errors.${form.errors.number}`)
          }
        >
          <label htmlFor="number">{t("number.label")}</label>
          <CardNumber
            disabled={!config}
            readOnly={cardReaderListening}
            autoFocus={config.autoFocus}
            placeholder={t("number.placeholder")}
            value={form.values.number}
            {...form.register("number")}
          />
          {form.errors?.number && (
            <Error>{t(`number.errors.${form.errors.number}`)}</Error>
          )}
        </Field>
      )}

      {fields.includes("expiry") && (
        <Field
          name="expiry"
          hasValue={form.values.expiry.length > 0}
          error={
            form.errors?.expiry && t(`expiry.errors.${form.errors.expiry}`)
          }
        >
          <label htmlFor="expiry">{t("expiry.label")}</label>
          <CardExpiry
            value={form.values.expiry}
            disabled={!config}
            readOnly={cardReaderListening}
            placeholder={t("expiry.placeholder")}
            {...form.register("expiry")}
          />
          {form.errors?.expiry && (
            <Error>{t(`expiry.errors.${form.errors.expiry}`)}</Error>
          )}
        </Field>
      )}

      {fields.includes("cvc") && (
        <Field
          name="cvc"
          hasValue={form.values.cvc.length > 0}
          error={form.errors?.cvc && t(`cvc.errors.${form.errors.cvc}`)}
        >
          <label htmlFor="cvc">{t("cvc.label")}</label>
          <CardCVC
            ref={cvc}
            value={form.values.cvc}
            disabled={!config}
            cardNumber={form.values.number}
            readOnly={cardReaderListening}
            placeholder={t("cvc.placeholder")}
            {...form.register("cvc")}
          />
          {form.errors?.cvc && (
            <Error>{t(`cvc.errors.${form.errors.cvc}`)}</Error>
          )}
        </Field>
      )}
    </fieldset>
  );
}
