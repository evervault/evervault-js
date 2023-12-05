import { useCallback } from "react";
import { useSearchParams } from "./useSearchParams";
import type {
  EvervaultFrameClientMessages,
  EvervaultFrameHostMessages,
  UIComponentMessageDetail,
} from "types";

export function useMessaging<
  ReceivableMessages extends EvervaultFrameHostMessages = EvervaultFrameHostMessages,
  SendableMessages extends EvervaultFrameClientMessages = EvervaultFrameClientMessages
>() {
  const { id } = useSearchParams();

  const on = useCallback(
    <T extends keyof ReceivableMessages>(
      type: T,
      callback: (payload: ReceivableMessages[T]) => void
    ) => {
      const handler = (event: MessageEvent<UIComponentMessageDetail>) => {
        if (event.data.type === type) {
          callback(event.data.payload as ReceivableMessages[T]);
        }
      };

      window.addEventListener("message", handler);
      return () => {
        window.removeEventListener("message", handler);
      };
    },
    []
  );

  const send = useCallback(
    <T extends keyof SendableMessages>(
      type: T,
      payload?: SendableMessages[T]
    ) => {
      window.parent.postMessage({ frame: id, type, payload }, "*");
    },
    [id]
  );

  return {
    on,
    send,
  };
}
