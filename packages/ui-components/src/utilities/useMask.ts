import IMask, { FactoryOpts } from "imask";
import { RefObject, useCallback, useEffect, useRef } from "react";
import { isChromeiOS } from "./userAgent";

interface UseMaskReturn {
  setValue: (newValue: string) => void;
  mask: React.RefObject<ReturnType<typeof IMask> | null>;
}

export function useMask(
  ref: RefObject<HTMLInputElement | null>,
  onAccept: (value: string) => void,
  config: FactoryOpts
): UseMaskReturn {
  const mask = useRef<ReturnType<typeof IMask>>(null);

  useEffect(() => {
    if (!ref.current) return undefined;
    mask.current = IMask(ref.current, config);

    const handleAccept = () => {
      if (!mask.current) return;
      onAccept(mask.current.unmaskedValue);
    };

    mask.current.on("accept", handleAccept);

    return () => {
      mask.current?.destroy();
      mask.current?.off("accept", handleAccept);
    };
  }, [config]);

  // Fallbacks for platforms (e.g., iOS Chrome/WebKit) where autofill does not
  // emit React onChange. Listen to native events directly to ensure we capture
  // autofill value updates.
  useEffect(() => {
    if (!ref.current) return;
    if (!isChromeiOS()) return;

    const inputEl = ref.current;
    const handleNativeEvent = () => {
      if (!mask.current) return;
      onAccept(mask.current.unmaskedValue);
    };

    inputEl.addEventListener("input", handleNativeEvent);
    inputEl.addEventListener("change", handleNativeEvent);
    inputEl.addEventListener("blur", handleNativeEvent);
    inputEl.addEventListener("focus", handleNativeEvent);

    return () => {
      inputEl.removeEventListener("input", handleNativeEvent);
      inputEl.removeEventListener("change", handleNativeEvent);
      inputEl.removeEventListener("blur", handleNativeEvent);
      inputEl.removeEventListener("focus", handleNativeEvent);
    };
  }, [ref, onAccept]);

  const setValue = useCallback((newValue: string) => {
    if (!mask.current) return;
    mask.current.value = newValue;
  }, []);

  return { setValue, mask };
}
