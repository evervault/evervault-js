import { useCallback, useRef } from "react";

// Uses broadcast channels to allow communication between multiple Evervault iframes.
// If you want to do messaging with the parent window use the useMessaging hook instead.
export function useBroadcastChannel<MessageMap>(name: string) {
  const channel = useRef(new BroadcastChannel(name));

  const send = useCallback(
    <T extends keyof MessageMap>(type: T, payload?: MessageMap[T]) => {
      channel.current.postMessage({ type, payload });
    },
    [],
  );

  const on = useCallback(
    <T extends keyof MessageMap>(
      type: T,
      callback: (payload: MessageMap[T]) => void,
    ) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === type) {
          callback(event.data.payload);
        }
      };

      channel.current.addEventListener("message", handler);
      return () => channel.current.removeEventListener("message", handler);
    },
    [],
  );

  return { on, send };
}
