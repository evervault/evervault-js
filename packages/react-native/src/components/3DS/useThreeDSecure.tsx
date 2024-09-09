import { useState } from "react";
import { useRef } from "react";
import { useEvervault } from "../EvervaultProvider";
import { startSession, threeDSecureSession } from "./threeDSSession";
import {
  ThreeDSecureCallbacks,
  ThreeDSecureSession,
  ThreeDSecureState
} from "./types";

export const useThreeDSecure = (): ThreeDSecureState => {
  const { appUuid } = useEvervault();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [session, setSession] = useState<ThreeDSecureSession | null>(null)  
  const [isVisible, setIsVisible] = useState(false); 

  if (!appUuid) {
    throw new Error(
      "useThreeDSecure must be used within an Evervault Provider"
    );
  }

  const start = (sessionId: string, callbacks: ThreeDSecureCallbacks) => {
    const session = threeDSecureSession({
      sessionId,
      appId: appUuid,
      callbacks,
      intervalRef,
      setIsVisible,
    });

    setSession(session);

    startSession(session, callbacks, intervalRef, setIsVisible);
  };

  const cancel = async () => {
    if (session) {
      await session.cancel();
    } else {
      console.warn("No 3DS session to cancel");
    }
  };

  return {
    start,
    cancel,
    session,
    isVisible: isVisible,
  };
};
