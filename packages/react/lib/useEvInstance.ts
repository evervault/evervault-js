import { useEvervault } from "./useEvervault";
import React from "react";
import EvervaultClient from "@evervault/browser";

export interface UseEvInstanceOptions<TInstance> {
  onMount(instance: EvervaultClient): TInstance | null | undefined;
  onMountError?(err: unknown): void;
  onUpdate?(instance: TInstance): void;
}

export function useEvInstance<TInstance>({
  onMount,
  onUpdate,
  onMountError,
}: UseEvInstanceOptions<TInstance>) {
  const ev = useEvervault();
  const [instance, setInstance] = React.useState<TInstance | null>(null);

  const onMountErrorRef = React.useRef(onMountError);
  onMountErrorRef.current = onMountError;

  React.useLayoutEffect(() => {
    const abortController = new AbortController();
    async function init() {
      try {
        const evervault = await ev;
        if (!evervault) return;
        if (abortController.signal.aborted) return;

        const instance = onMount(evervault);
        if (!instance) return;

        setInstance(instance);
      } catch (error) {
        onMountErrorRef.current?.(error);
        console.error(error);
      }
    }

    if (instance) {
      onUpdate?.(instance);
    } else {
      init();
      return () => abortController.abort();
    }
  }, [ev, onMount, onUpdate, instance]);

  return instance;
}
