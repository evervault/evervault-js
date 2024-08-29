import { UseFormReturn } from "../useForm";
import { Dispatch, SetStateAction, createContext, useContext } from "react";
import { CardForm, CardField } from "./types";

type Context<T> = {
  values: CardForm;
  register: UseFormReturn<T>["register"];
  setRegisteredFields: Dispatch<SetStateAction<Set<CardField>>>;
};

export const removeFieldFromSet = (prev: Set<CardField>, field: CardField) => {
  const next = new Set(prev);
  next.delete("name");
  return next;
};

export const CardContext = createContext<Context<CardForm>>({
  values: {
    name: "",
    number: "",
    cvc: "",
    expiry: "",
  },
  register: () => ({
    onChange: () => {},
    onBlur: () => {},
  }),
  setRegisteredFields: () => {},
});

export const useCardContext = () => useContext(CardContext);
