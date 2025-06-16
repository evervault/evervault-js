import { useCallback, useMemo, useState } from "react";
import { useRef } from "react";
import { startSession, threeDSecureSession } from "./session";
import { ThreeDSecureSession, ThreeDSecureState } from "./types";
import { useEvervault } from "../useEvervault";

export function useThreeDSecure(): ThreeDSecureState {
  const { appId } = useEvervault();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [session, setSession] = useState<ThreeDSecureSession | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const start = useCallback<ThreeDSecureState["start"]>(
    (sessionId, options) => {
      const session = threeDSecureSession({
        sessionId,
        appId,
        options,
        intervalRef,
        setIsVisible,
      });

      setSession(session);

      startSession(session, options, intervalRef, setIsVisible);
    },
    [appId]
  );

  const cancel = useCallback<ThreeDSecureState["cancel"]>(async () => {
    if (session) {
      await session.cancel();
    } else {
      console.warn("No 3DS session to cancel");
    }
  }, [session]);

  return useMemo(
    () => ({
      start,
      cancel,
      session,
      isVisible,
    }),
    [start, cancel, session, isVisible]
  );
}
