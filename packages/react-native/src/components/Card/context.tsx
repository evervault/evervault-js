import { UseFormReturn } from 'shared';
import { createContext, useContext } from 'react';
import { CardForm } from './types';

type Context<T> = {
  values: CardForm;
  registerFn: UseFormReturn<T>['register'];
};

export const CardContext = createContext<Context<CardForm>>({
  values: {
    name: '',
    number: '',
    cvc: '',
    expiry: '',
  },
  registerFn: () => ({
    onChange: () => {},
    onBlur: () => {},
  }),
});

export const useCardContext = () => useContext(CardContext);
