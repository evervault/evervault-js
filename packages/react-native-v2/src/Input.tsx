import {
  ForwardedRef,
  forwardRef,
  PropsWithRef,
  ReactNode,
  Ref,
  RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import {
  NativeSyntheticEvent,
  TextInput,
  TextInputFocusEventData,
  TextInputProps,
} from "react-native";
import { mergeRefs } from "./utils";
import { Controller, useFormContext } from "react-hook-form";
import MaskInput, { Mask, MaskArray } from "react-native-mask-input";

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
  return format.split("").map((char) => {
    if (char === "9") {
      return /\d/;
    }
    return char;
  });
}

export interface EvervaultInputProps<Values extends Record<string, unknown>>
  extends BaseEvervaultInputProps {
  name: keyof Values;
  mask?: Mask;
}

export const EvervaultInput = forwardRef<
  EvervaultInput,
  EvervaultInputProps<Record<string, unknown>>
>(function EvervaultInput({ name, mask, ...props }, ref) {
  const inputRef = useForwardedInputRef(ref);

  const methods = useFormContext();

  return (
    <Controller
      control={methods.control}
      name={name}
      shouldUnregister
      render={({ field, fieldState }) => (
        <MaskInput
          // Overridable props
          id={field.name}
          {...props}
          // Strict props
          ref={mergeRefs(inputRef, field.ref)}
          editable={!field.disabled && (props.editable ?? true)}
          onBlur={(evt) => {
            field.onBlur();
            methods.setValue(field.name, field.value, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
            props.onBlur?.(evt);
          }}
          mask={mask}
          maskAutoComplete={!!mask}
          value={field.value}
          onChangeText={(masked, unmasked) => {
            methods.setValue(field.name, unmasked, {
              shouldDirty: true,
              shouldValidate: !!fieldState.error || fieldState.isTouched,
            });
          }}
          defaultValue={undefined}
        />
      )}
    />
  );
}) as <Values extends Record<string, unknown>>(
  props: EvervaultInputProps<Values> & { ref?: Ref<EvervaultInput> }
) => ReactNode;
