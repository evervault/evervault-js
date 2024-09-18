import IMask, { FactoryOpts } from "imask";
import { RefObject, useCallback, useEffect, useRef } from "react";

interface UseMaskReturn {
  setValue: (newValue: string) => void;
  getUnmaskedValue: () => string | undefined;
}

export function useMask(
  ref: RefObject<HTMLInputElement>,
  onAccept: (value: string) => void,
  config: FactoryOpts
): UseMaskReturn {
  const mask = useRef<ReturnType<typeof IMask>>();

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

  const setValue = useCallback((newValue: string) => {
    if (!mask.current) return;
    mask.current.value = newValue;
  }, []);

  const getUnmaskedValue = useCallback(() => {
    if (!mask.current) return "";
    return mask.current.unmaskedValue;
  }, []);

  return { setValue, getUnmaskedValue };
}
