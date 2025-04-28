import {
  validateNumber,
  validateCVC,
  validateExpiry,
} from "@evervault/card-validator";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useForm, useTranslations } from "shared";
import { Error } from "../Common/Error";
import { Field } from "../Common/Field";
import { resize } from "../utilities/resize";
import { useMessaging } from "../utilities/useMessaging";
import { BrandIcon } from "./BrandIcon";
import { CardCVC } from "./CardCVC";
import { CardExpiry } from "./CardExpiry";
import { CardHolder } from "./CardHolder";
import { CardNumber } from "./CardNumber";
import { DEFAULT_TRANSLATIONS } from "./translations";
import { useCardReader } from "./useCardReader";
import {
  changePayload,
  collectIcons,
  isAcceptedBrand,
  swipePayload,
} from "./utilities";
import type { CardForm, CardConfig } from "./types";
import type {
  CardField,
  CardFrameClientMessages,
  CardFrameHostMessages,
} from "types";
import { useEncryption } from "../EncryptionProvider";

export function Card({ config }: { config: CardConfig }) {
  const cvc = useRef<HTMLInputElement | null>(null);
  const { on, send } = useMessaging<
    CardFrameHostMessages,
    CardFrameClientMessages
  >();

  const en = useEncryption();
  const { t } = useTranslations(DEFAULT_TRANSLATIONS, config?.translations);

  const { acceptedBrands } = config;

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
      name: config.defaultValues?.name ?? "",
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

        const cardValidation = validateNumber(values.number);
        if (!cardValidation.isValid) {
          return "invalid";
        }

        if (!isAcceptedBrand(acceptedBrands, cardValidation)) {
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

        const cardValidation = validateNumber(values.number);
        const cvcValidation = validateCVC(values.cvc, values.number);

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
        const cardData = await changePayload(en, formState, fields, {
          allow3DigitAmexCVC: config.allow3DigitAmexCVC,
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
      const swipeData = await swipePayload(en, card);
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
        form.validate((formState) => {
          void (async () => {
            const data = await changePayload(en, formState, fields, {
              allow3DigitAmexCVC: config.allow3DigitAmexCVC,
            });
            send("EV_VALIDATED", data);
          })();
        });
      }),
    [en, on, send, form, fields, config.allow3DigitAmexCVC]
  );

  useEffect(
    () =>
      on("EV_UPDATE_NAME", (name) => {
        form.setValue("name", name);
      }),
    [on, form]
  );

  const hasErrors = Object.keys(form.errors ?? {}).length > 0;

  const handleFocus = (field: CardField) => () => {
    send("EV_FOCUS", field);
  };

  const handleBlur = (field: CardField) => () => {
    send("EV_BLUR", field);
  };

  const handleKeyDown = (field: CardField) => () => {
    send("EV_KEYDOWN", field);
  };

  const handleKeyUp = (field: CardField) => () => {
    send("EV_KEYUP", field);
  };

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
            autoComplete={config.autoComplete?.name ?? true}
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

          {config.icons && (
            <BrandIcon
              icons={collectIcons(config.icons)}
              number={form.values.number}
            />
          )}

          <CardNumber
            disabled={!config}
            readOnly={cardReaderListening}
            autoFocus={config.autoFocus}
            placeholder={t("number.placeholder")}
            value={form.values.number}
            autoComplete={config.autoComplete?.number ?? true}
            autoProgress={config.autoProgress}
            form={form}
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
            autoComplete={config.autoComplete?.expiry ?? true}
            autoProgress={config.autoProgress}
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
            onFocus={handleFocus("cvc")}
            onKeyUp={handleKeyUp("cvc")}
            onKeyDown={handleKeyDown("cvc")}
            autoComplete={config.autoComplete?.cvc ?? true}
            redact={config.redactCVC}
            {...form.register("cvc", {
              onBlur: handleBlur("cvc"),
            })}
          />
          {form.errors?.cvc && (
            <Error>{t(`cvc.errors.${form.errors.cvc}`)}</Error>
          )}
        </Field>
      )}
    </fieldset>
  );
}
