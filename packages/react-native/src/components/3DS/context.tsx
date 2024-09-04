import React, { createContext, useContext, useEffect, useRef, useState } from "react";

import { ThreeDSecureProviderProps, ThreeDSecureSession } from "./types";
import { useEvervault } from "../EvervaultProvider";
import { startSession, threeDSecureSession } from "./threeDSSession";
import { ThreeDSecureFrame } from "./ThreeDSecureFrame";

interface ThreeDSContextType {
  session: ThreeDSecureSession;
}

const ThreeDSContext = createContext<ThreeDSContextType | undefined>(
  undefined
);

// Custom hook to get the ThreeDSecure session
function useThreeDSecureSession(): ThreeDSContextType {
  const context = useContext(ThreeDSContext);

  if (!context) {
    throw new Error("useThreeDSecure must be used within a ThreeDSecure Provider");
  }

  return context;
}

function useThreeDSecureCancelSession() {
  const { session } = useThreeDSecureSession();
  return session.cancel;
}


function ThreeDSecure({ sessionId, callbacks, children }: ThreeDSecureProviderProps) {
  const { appUuid } = useEvervault();

  if (!appUuid) {
    throw new Error("useThreeDS must be used within an Evervault Provider");
  }

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [shouldDisplayModal, setShouldDisplayModal] = useState(false);

  const session = threeDSecureSession({
      sessionId,
      appId: appUuid,
      callbacks,
      intervalRef,
      setDisplayModal: setShouldDisplayModal
  });

  useEffect(() => {
      startSession(session, callbacks, intervalRef, setShouldDisplayModal);
      // Cleanup interval on component unmount
      return () => {
          if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
          }
      };
  }, [session]);

  const value = {
    session
  };

  return (
    <ThreeDSContext.Provider value={value}>
      { shouldDisplayModal ? children : null }
    </ThreeDSContext.Provider>
  );
}

const SessionFrame = () => {
    const { session } = useThreeDSecureSession();
    return <ThreeDSecureFrame sessionId={session.sessionId} />;
}; 


const ThreeDSecureNamespace = Object.assign(ThreeDSecure, {
    Frame: SessionFrame
});

export {
  ThreeDSecureNamespace as ThreeDSecure,
  useThreeDSecureCancelSession
}

