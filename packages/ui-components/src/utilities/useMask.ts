import IMask, { FactoryOpts } from "imask";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";

type UseMaskReturn = [string, (value: string) => void];

export function useMask(
  ref: RefObject<HTMLInputElement>,
  config: FactoryOpts
): UseMaskReturn {
  const [value, setValue] = useState("");
  const mask = useRef<ReturnType<typeof IMask>>();

  useEffect(() => {
    if (!ref.current) return;
    mask.current = IMask(ref.current, config);

    const handleAccept = () => {
      if (!mask.current) return;
      setValue(mask.current.unmaskedValue);
    };

    mask.current.on("accept", handleAccept);

    return () => {
      mask.current?.destroy();
      mask.current?.off("accept", handleAccept);
    };
  }, [config]);

  const updateValue = useCallback((value: string) => {
    if (!mask.current) return;
    mask.current.value = value;
  }, []);

  return [value, updateValue];
}
