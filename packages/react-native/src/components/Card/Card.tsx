import {
  validateNumber,
  validateCVC,
  validateExpiry,
} from "@evervault/card-validator";
import * as React from "react";
import { ReactNode, useState } from "react";
import { useForm } from "../useForm";
import { changePayload, isAcceptedBrand } from "./utilities";
import type { CardForm, CardConfig, CardField, CardPayload } from "./types";
import { CardNumber } from "./CardNumber";
import { CardContext } from "./context";
import { encrypt } from "../../sdk";
import { CardCVC } from "./CardCVC";
import { CardHolder } from "./CardHolder";
import { CardExpiry } from "./CardExpiry";
import { StyleProp, TextInputProps, TextStyle, View } from "react-native";

export type BaseProps = Omit<
  TextInputProps,
  "onChange" | "onChangeText" | "inputMode" | "autoComplete" | "value"
>;

export interface CardProps {
  initialValue?: Partial<CardForm>;
  config?: CardConfig;
  children: ReactNode;
  onChange?: (payload: CardPayload) => void;
  style?: StyleProp<TextStyle>;
}

function Card({ initialValue, config, children, onChange, style }: CardProps) {
  const [registeredFields, setRegisteredFields] = useState<Set<CardField>>(
    new Set()
  );

  const form = useForm<CardForm>({
    initialValues: {
      cvc: initialValue?.cvc ?? "",
      expiry: initialValue?.expiry ?? "",
      number: initialValue?.number ?? "",
      name: initialValue?.name ?? "",
    },
    validate: {
      name: (values) => {
        if (!registeredFields.has("name")) {
          return undefined;
        }

        if (values.name == null || values.name.length === 0) {
          return "invalid";
        }

        return undefined;
      },
      number: (values) => {
        if (!registeredFields.has("number")) {
          return undefined;
        }
        if (values.number == null) {
          return "invalid";
        }
        const cardValidation = validateNumber(values.number);
        if (!cardValidation.isValid) {
          return "invalid";
        }

        if (!isAcceptedBrand(config?.acceptedBrands, cardValidation)) {
          return "unsupportedBrand";
        }

        return undefined;
      },
      expiry: (values) => {
        if (!registeredFields.has("expiry")) {
          return undefined;
        }
        if (values.expiry == null) {
          return "invalid";
        }
        const expiryValidation = validateExpiry(values.expiry);
        if (!expiryValidation.isValid) {
          return "invalid";
        }

        return undefined;
      },
      cvc: (values) => {
        if (!registeredFields.has("cvc")) {
          return undefined;
        }
        if (values.cvc == null) {
          return "invalid";
        }
        const cvcValidation = validateCVC(values.cvc, values.number);
        if (!cvcValidation.isValid) {
          return "invalid";
        }

        return undefined;
      },
    },
    onChange: (formState) => {
      const triggerChange = async () => {
        const cardData = await changePayload(
          encrypt,
          formState,
          Array.from(registeredFields)
        );
        if (onChange) {
          onChange(cardData);
        }
      };

      triggerChange();
    },
  });

  return (
    <CardContext.Provider
      value={{
        values: form.values,
        register: form.register,
        setRegisteredFields,
      }}
    >
      <View style={style}>{children}</View>
    </CardContext.Provider>
  );
}

const CardNamespace = Object.assign(Card, {
  Number: CardNumber,
  CVC: CardCVC,
  Holder: CardHolder,
  Expiry: CardExpiry,
});

export { CardNamespace as Card };
