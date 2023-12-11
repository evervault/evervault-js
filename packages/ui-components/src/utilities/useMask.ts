import IMask, { FactoryOpts } from "imask";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";

type UseMaskReturn = [string, (value: string) => void];

export function useMask(
  ref: RefObject<HTMLInputElement>,
  config: FactoryOpts,
  onAccept?: (value: string) => void
): UseMaskReturn {
  const [value, setValue] = useState("");
  const mask = useRef<ReturnType<typeof IMask>>();

  useEffect(() => {
    if (!ref.current) return undefined;
    mask.current = IMask(ref.current, config);

    const handleAccept = () => {
      if (!mask.current) return;
      setValue(mask.current.unmaskedValue);
      if (onAccept) onAccept(mask.current.unmaskedValue);
    };

    mask.current.on("accept", handleAccept);

    return () => {
      mask.current?.destroy();
      mask.current?.off("accept", handleAccept);
    };
  }, [config]);

  const updateValue = useCallback((newValue: string) => {
    if (!mask.current) return;
    mask.current.value = newValue;
  }, []);

  return [value, updateValue];
}
