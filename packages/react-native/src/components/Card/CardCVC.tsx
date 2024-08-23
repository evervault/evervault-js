import { validateNumber } from "@evervault/card-validator";
import * as React from "react";
import { useEffect, useMemo } from "react";
import { TextInputMask } from "react-native-masked-text";
import { removeFieldFromSet, useCardContext } from "./context";
import { BaseProps } from "./Card";

export interface CVCProps extends BaseProps {}

export const CardCVC = (props: CVCProps) => {
  const context = useCardContext();
  const mask = useMemo(() => {
    if (!context.values.number) {
      return "9999";
    }
    const type = validateNumber(context.values.number).brand;
    if (type === "american-express") {
      return "9999";
    }
    return "999";
  }, [context.values.number]);

  const { onChange, onBlur } = context.register("cvc");

  useEffect(() => {
    context.setRegisteredFields((prev) => new Set(prev).add("cvc"));
    return () =>
      context.setRegisteredFields((prev) => removeFieldFromSet(prev, "cvc"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TextInputMask
      {...props}
      type="custom"
      options={{ mask }}
      value={context.values.cvc}
      onChangeText={(t) => onChange(t)}
      id="cvc"
      onBlur={(e) => {
        onBlur(e);
        props.onBlur?.(e);
      }}
      inputMode="numeric"
      autoComplete="cc-csc"
    />
  );
};
