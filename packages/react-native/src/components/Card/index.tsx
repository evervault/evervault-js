import {
  validateNumber,
  validateCVC,
  validateExpiry,
} from '@evervault/card-validator';
import { ReactNode } from 'react';
import { useForm, useTranslations } from 'shared';
import { DEFAULT_TRANSLATIONS } from './translations';
import { changePayload, isAcceptedBrand } from './utilities';
import type { CardForm, CardConfig } from './types';
import { CardNumber } from './CardNumber';
import { CardContext } from './context';
import { CardPayload } from 'types';
import { encrypt } from '../../sdk';

export type CardProps = {
  config: CardConfig;
  children: ReactNode;
  onChange: (payload: CardPayload) => void;
};

function Card({ config, children, onChange }: CardProps) {
  const { t } = useTranslations(DEFAULT_TRANSLATIONS, config?.translations);

  const form = useForm<CardForm>({
    initialValues: {
      cvc: '',
      expiry: '',
      number: '',
      name: '',
    },
    validate: {
      name: (values) => {
        return undefined;
      },
      number: (values) => {
        const cardValidation = validateNumber(values.number);
        if (!cardValidation.isValid) {
          return 'invalid';
        }

        if (!isAcceptedBrand(config.acceptedBrands, cardValidation)) {
          return 'unsupportedBrand';
        }

        return undefined;
      },
      expiry: (values) => {
        const expiryValidation = validateExpiry(values.expiry);
        if (!expiryValidation.isValid) {
          return 'invalid';
        }

        return undefined;
      },
      cvc: (values) => {
        const cvcValidation = validateCVC(values.cvc, values.number);
        if (!cvcValidation.isValid) {
          return 'invalid';
        }

        return undefined;
      },
    },
    onChange: (formState) => {
      const triggerChange = async () => {
        const cardData = await changePayload(encrypt, formState, ['cvc']);
        onChange(cardData);
      };

      void triggerChange();
    },
  });

  const hasErrors = Object.keys(form.errors ?? {}).length > 0;

  return (
    <CardContext.Provider
      value={{
        values: form.values,
        registerFn: form.register,
      }}
    >
      {children}
    </CardContext.Provider>
  );
}

const CardNamespace = Object.assign(Card, {
  Number: CardNumber,
});

export { CardNamespace as Card };
