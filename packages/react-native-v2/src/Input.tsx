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
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import {
  StyleProp,
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
  autoProgress?: boolean;
}

export const EvervaultInputContext = createContext<EvervaultInputContextValue>({
  validationMode: "all",
});

export interface FocusTarget {
  focus(): void;
}

// The inputs in the order they first rendered, which auto-advance moves along.
export interface FocusOrderContextValue {
  register(target: FocusTarget): () => void;
  next(target: FocusTarget): void;
}

export const FocusOrderContext = createContext<FocusOrderContextValue>({
  register: () => () => {},
  next: () => {},
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

// For the fields that can be full: a fixed length, or a `maxLength`.
export interface AutoProgressProps {
  /**
   * Whether to move focus to the next field once this one is filled. Overrides
   * the card's `autoProgress` for this field.
   */
  autoProgress?: boolean;
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

// Filled when every slot the mask has for the value holds a typed character,
// or, without a mask, when the value reaches its longest.
function isFilled(
  mask: Mask | undefined,
  limit: number | undefined,
  typed: string
) {
  if (!mask) return limit !== undefined && typed.length >= limit;

  const slots = (typeof mask === "function" ? mask(typed) : mask).filter(
    (slot) => typeof slot !== "string"
  ).length;

  return typed.length === slots;
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
  extends BaseEvervaultInputProps,
    AutoProgressProps {
  name: keyof Values;
  mask?: Mask;
  obfuscateValue?: boolean | string;
  // The text the input shows from the stored value, and the value it stores
  // from the text typed, for inputs writing part of a value.
  read?(stored: string): string;
  write?(typed: string, stored: string): string;
  // The longest value an input without a mask takes.
  limit?: number;
  // Whether leaving the input leaves a value ready to check; by default always.
  checksOnBlur?(stored: string): boolean;
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
    checksOnBlur,
    label,
    labelStyle,
    autoProgress,
    ...props
  },
  ref
) {
  const { validationMode, autoProgress: cardAutoProgress } = useContext(
    EvervaultInputContext
  );
  const focusOrder = useContext(FocusOrderContext);

  const inputRef = useForwardedInputRef(ref);

  const focusTarget = useMemo<FocusTarget>(
    () => ({ focus: () => inputRef.current?.focus() }),
    [inputRef]
  );

  useLayoutEffect(
    () => focusOrder.register(focusTarget),
    [focusOrder, focusTarget]
  );

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
      // Strict props
      ref={mergeRefs(inputRef, field.ref)}
      editable={!field.disabled && (props.editable ?? true)}
      onBlur={(evt) => {
        if (checksOnBlur && !checksOnBlur(field.value ?? "")) {
          props.onBlur?.(evt);
          return;
        }

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

        const advances = autoProgress ?? cardAutoProgress;
        if (advances && isFilled(mask, limit, unmasked)) {
          focusOrder.next(focusTarget);
        }
      }}
      // Remove unwanted props
      defaultValue={undefined}
      onChange={undefined}
    />
  );

  if (!label) return input;

  // The input reads the label out itself.
  return (
    <View>
      <Text
        style={labelStyle}
        accessible={false}
        importantForAccessibility="no"
      >
        {label}
      </Text>
      {input}
    </View>
  );
}) as <Values extends Record<string, unknown>>(
  props: EvervaultInputProps<Values> & { ref?: Ref<EvervaultInput> }
) => ReactNode;
