import { useCallback, useMemo, useState } from "react";
import { useRef } from "react";
import { startSession, threeDSecureSession } from "./session";
import {
  ThreeDSecureOptions,
  ThreeDSecureSession,
  ThreeDSecureState,
} from "./types";
import { useEvervault } from "../useEvervault";

export interface UseThreeDSecureOptions {
  failOnChallenge?: boolean | (() => Promise<boolean>);
}

export function useThreeDSecure(
  options?: UseThreeDSecureOptions
): ThreeDSecureState {
  const { appId } = useEvervault();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [session, setSession] = useState<ThreeDSecureSession | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const failOnChallenge = options?.failOnChallenge ?? false;

  const start = useCallback<ThreeDSecureState["start"]>(
    (sessionId, options) => {
      const startOptions: ThreeDSecureOptions = {
        ...options,
        failOnChallenge: options?.failOnChallenge ?? failOnChallenge,
      };

      const session = threeDSecureSession({
        sessionId,
        appId,
        options: startOptions,
        intervalRef,
        setIsVisible,
      });

      setSession(session);

      startSession(session, startOptions, intervalRef, setIsVisible);
    },
    [appId, failOnChallenge]
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
