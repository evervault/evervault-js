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
  useMemo,
  useRef,
} from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
} from "react-native";
import { mergeRefs } from "./utils";
import { useController, useFormContext } from "react-hook-form";
import MaskInput, { Mask, MaskArray } from "react-native-mask-input";

export interface EvervaultInputContextValue {
  validationMode: "onChange" | "onBlur" | "onTouched" | "all";
}

export const EvervaultInputContext = createContext<EvervaultInputContextValue>({
  validationMode: "all",
});

// Fields inside a `Card.Row` share its width.
export const CardRowContext = createContext(false);

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
): RefObject<TextInput | null> {
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

export interface BaseEvervaultInputProps
  extends Omit<
    TextInputProps,
    "onChange" | "onChangeText" | "value" | "defaultValue"
  > {
  /**
   * Text rendered above the field, also read out as its accessibility label.
   */
  label?: string;

  /**
   * The style of the `label` text.
   */
  labelStyle?: StyleProp<TextStyle>;
}

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

function getMaskLength(mask: Mask | undefined, value?: string) {
  if (!mask) {
    return undefined;
  } else if (typeof mask === "function") {
    return mask(value).length;
  } else {
    return mask.length;
  }
}

export interface EvervaultInputProps<Values extends Record<string, unknown>>
  extends BaseEvervaultInputProps {
  name: keyof Values;
  mask?: Mask;
  obfuscateValue?: boolean | string;
  // The text the input shows from the stored value, and the value it stores
  // from the text typed, for inputs writing part of a value.
  read?(stored: string): string;
  write?(typed: string, stored: string): string;
  // The longest value an input without a mask takes.
  limit?: number;
}

export const EvervaultInput = forwardRef<
  EvervaultInput,
  EvervaultInputProps<Record<string, unknown>>
>(function EvervaultInput(
  {
    name,
    mask,
    obfuscateValue,
    read,
    write,
    limit,
    label,
    labelStyle,
    ...props
  },
  ref
) {
  const { validationMode } = useContext(EvervaultInputContext);
  const inRow = useContext(CardRowContext);

  const inputRef = useForwardedInputRef(ref);

  const methods = useFormContext();

  const { field, fieldState } = useController({
    control: methods.control,
    name,
    shouldUnregister: true,
  });

  const obfuscationCharacter = useMemo(() => {
    if (typeof obfuscateValue === "string") {
      return obfuscateValue;
    } else {
      return "•";
    }
  }, [obfuscateValue]);

  const value = read ? read(field.value ?? "") : field.value;

  const input = (
    <MaskInput
      // Overridable props
      id={field.name}
      accessibilityLabel={label}
      {...props}
      style={label || !inRow ? props.style : [styles.shared, props.style]}
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
      maxLength={getMaskLength(mask, value) ?? limit}
      maskAutoComplete={!!mask}
      obfuscationCharacter={obfuscationCharacter}
      showObfuscatedValue={!!obfuscateValue}
      value={value}
      onChangeText={(masked, unmasked) => {
        const stored = write ? write(unmasked, field.value ?? "") : unmasked;
        const shouldValidate =
          (validationMode === "onTouched" && fieldState.isTouched) ||
          ((validationMode === "onChange" || validationMode === "all") &&
            (!!fieldState.error || fieldState.isTouched));
        methods.setValue(field.name, stored, {
          shouldDirty: true,
          shouldValidate,
        });
      }}
      // Remove unwanted props
      defaultValue={undefined}
      onChange={undefined}
    />
  );

  if (!label) return input;

  return (
    <View style={inRow ? styles.shared : undefined}>
      <Text style={labelStyle}>{label}</Text>
      {input}
    </View>
  );
}) as <Values extends Record<string, unknown>>(
  props: EvervaultInputProps<Values> & { ref?: Ref<EvervaultInput> }
) => ReactNode;

const styles = StyleSheet.create({
  shared: {
    flex: 1,
  },
});
