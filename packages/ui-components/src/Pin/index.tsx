import { IMaskInput } from "react-imask";
import {
  ClipboardEvent,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Field } from "../Common/Field";
import type {
  ThemeObject,
  EvervaultFrameHostMessages,
  PinFrameClientMessages,
} from "types";
import { useMessaging } from "../utilities/useMessaging";
import { useEvervault } from "@evervault/react";

const MODES = {
  numeric: {
    mask: "0",
  },
  alphanumeric: {
    mask: "[0a]",
  },
};

type PinConfig = {
  autoFocus?: boolean;
  theme?: ThemeObject;
  length?: number;
  mode?: "numeric" | "alphanumeric";
  inputType?: "number" | "text" | "password";
};

export function Pin({ config }: { config: PinConfig }) {
  const ev = useEvervault();
  const ref = useRef<HTMLFieldSetElement | null>(null);
  const [pin, setPin] = useState("");
  const length = config?.length || 4;
  const messages = useMessaging<
    EvervaultFrameHostMessages,
    PinFrameClientMessages
  >();
  const mode = useMemo(() => MODES[config?.mode || "numeric"], [config]);

  const focus = useCallback(() => {
    if (!ref.current) return;
    const inputs = ref.current.querySelectorAll("input");
    const index = [...inputs].findIndex((input) => !input.value);
    const input = index >= 0 ? inputs[index] : inputs[inputs.length - 1];
    input.focus();
  }, []);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const isFocused = ref.current.contains(document.activeElement);
    if (!isFocused) return;
    focus();
  });

  const handlePaste = (e: ClipboardEvent<HTMLFieldSetElement>) => {
    e.preventDefault();
    const text = e.clipboardData?.getData("text/plain");
    if (text?.length !== length) return;
    setPin(text);
  };

  const handleChange = (value: string) => {
    if (pin.length >= length) return;
    const newPin = pin + value;

    const publishChange = async () => {
      if (!ev) return;
      const encrypted = await ev.encrypt(newPin);
      const isComplete = newPin.length === length;
      const payload = { isComplete, value: encrypted };
      messages.send("EV_CHANGE", payload);
      if (isComplete) {
        messages.send("EV_COMPLETE", payload);
      }
    };

    publishChange();
    setPin(newPin);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newPin = pin.slice(0, -1);
      setPin(newPin);
    }
  };

  return (
    <fieldset
      ref={ref}
      ev-component="pin"
      onFocus={focus}
      onPaste={handlePaste}
    >
      {Array.from({ length }).map((_, i) => (
        <Field key={i} hasValue={pin[i] !== undefined}>
          <PinInput
            value={pin[i] || ""}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={!config}
            mask={mode.mask}
            name={`pin-${i}`}
            type={config?.inputType || "text"}
            autoFocus={config?.autoFocus && i === 0}
            ariaLabel={`Pin character ${i + 1}`}
          />
        </Field>
      ))}
    </fieldset>
  );
}

function PinInput({
  value,
  onChange,
  onKeyDown,
  disabled,
  mask,
  name,
  ariaLabel,
  autoFocus,
  type,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled: boolean;
  mask: string;
  name?: string;
  ariaLabel?: string;
  autoFocus?: boolean;
  type: "number" | "text" | "password";
}) {
  return (
    <IMaskInput
      unmask
      mask={mask}
      name={name}
      type={type}
      prepareChar={(char) => char.toUpperCase()}
      placeholder="•"
      value={value}
      onAccept={onChange}
      onKeyDown={onKeyDown}
      inputMode="numeric"
      disabled={disabled}
      aria-label={ariaLabel}
      autoFocus={autoFocus}
      autoComplete="one-time-code"
    />
  );
}
