import {
  createContext,
  ForwardedRef,
  forwardRef,
  ReactNode,
  Ref,
  RefObject,
  useCallback,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { TextInput, TextInputProps } from "react-native";
import { mergeRefs } from "./utils";
import { Controller, useController, useFormContext } from "react-hook-form";
import MaskInput, { Mask, MaskArray } from "react-native-mask-input";

export interface EvervaultInputContextValue {
  validationMode: "onChange" | "onBlur" | "onTouched" | "all";
}

export const EvervaultInputContext = createContext<EvervaultInputContextValue>({
  validationMode: "all",
});

export type EvervaultInput = Pick<
  TextInput,
  | "isFocused"
  | "focus"
  | "blur"
  | "clear"
  | "measure"
  | "measureInWindow"
  | "measureLayout"
>;

function useForwardedInputRef(
  ref: ForwardedRef<EvervaultInput>
): RefObject<TextInput> {
  const inputRef = useRef<TextInput>(null);

  useImperativeHandle<EvervaultInput, EvervaultInput>(
    ref,
    useCallback(
      () => ({
        isFocused() {
          return inputRef.current?.isFocused() ?? false;
        },
        focus() {
          inputRef.current?.focus();
        },
        blur() {
          inputRef.current?.blur();
        },
        clear() {
          inputRef.current?.clear();
        },
        measure(callback) {
          inputRef.current?.measure(callback);
        },
        measureInWindow(callback) {
          inputRef.current?.measureInWindow(callback);
        },
        measureLayout(relativeToNativeComponentRef, onSuccess, onFail) {
          inputRef.current?.measureLayout(
            relativeToNativeComponentRef,
            onSuccess,
            onFail
          );
        },
      }),
      [inputRef]
    )
  );

  return inputRef;
}

export type BaseEvervaultInputProps = Omit<
  TextInputProps,
  "onChange" | "onChangeText" | "value" | "defaultValue"
>;

export function mask(format: string): MaskArray {
  const maskArray: MaskArray = [];

  let isObfuscated = false;
  format.split("").forEach((char) => {
    if (char === "[") {
      isObfuscated = true;
      return;
    } else if (char === "]") {
      isObfuscated = false;
      return;
    }

    let value: string | RegExp | [RegExp] = char;
    if (char === "9") {
      value = isObfuscated ? [/\d/] : /\d/;
    }
    maskArray.push(value);
  });

  return maskArray;
}

export interface EvervaultInputProps<Values extends Record<string, unknown>>
  extends BaseEvervaultInputProps {
  name: keyof Values;
  mask?: Mask;
  obfuscateValue?: boolean;
}

export const EvervaultInput = forwardRef<
  EvervaultInput,
  EvervaultInputProps<Record<string, unknown>>
>(function EvervaultInput({ name, mask, obfuscateValue, ...props }, ref) {
  const { validationMode } = useContext(EvervaultInputContext);

  const inputRef = useForwardedInputRef(ref);

  const methods = useFormContext();

  const { field, fieldState } = useController({
    control: methods.control,
    name,
    shouldUnregister: true,
  });

  return (
    <MaskInput
      // Overridable props
      id={field.name}
      {...props}
      // Strict props
      ref={mergeRefs(inputRef, field.ref)}
      editable={!field.disabled && (props.editable ?? true)}
      onBlur={(evt) => {
        const shouldValidate =
          validationMode === "onBlur" ||
          validationMode === "onTouched" ||
          validationMode === "all";
        methods.setValue(field.name, field.value, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate,
        });
        props.onBlur?.(evt);
      }}
      mask={mask}
      maskAutoComplete={!!mask}
      obfuscationCharacter="•"
      showObfuscatedValue={obfuscateValue}
      value={field.value}
      onChangeText={(masked, unmasked) => {
        const shouldValidate =
          (validationMode === "onTouched" && fieldState.isTouched) ||
          ((validationMode === "onChange" || validationMode === "all") &&
            (!!fieldState.error || fieldState.isTouched));
        methods.setValue(field.name, unmasked, {
          shouldDirty: true,
          shouldValidate,
        });
      }}
      // Remove unwanted props
      defaultValue={undefined}
      onChange={undefined}
    />
  );
}) as <Values extends Record<string, unknown>>(
  props: EvervaultInputProps<Values> & { ref?: Ref<EvervaultInput> }
) => ReactNode;
