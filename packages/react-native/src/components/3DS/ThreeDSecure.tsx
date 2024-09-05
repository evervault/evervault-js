import React, { createContext, useContext } from "react";
import { ThreeDSecureProviderProps } from "./types";
import { useEvervault } from "../EvervaultProvider";
import { ThreeDSecureFrame } from "./ThreeDSecureFrame";

interface ThreeDSecureFrameContext {
  sessionId: string;
}

const ThreeDSecureContext = createContext<ThreeDSecureFrameContext | null>(null);

const ThreeDSecure = ({ state, children }: ThreeDSecureProviderProps) => {
  const { appUuid } = useEvervault();

  if (!appUuid) {
    throw new Error("ThreeDSecure must be used within an Evervault Provider");
  }

  const { session, displayModal } = state;

  if (!session) return null;

  return (
    <ThreeDSecureContext.Provider value={{ sessionId: session.sessionId }}>
      {displayModal && children}
    </ThreeDSecureContext.Provider>
  );
};

const SessionFrame = () => {
  const context = useContext(ThreeDSecureContext);

  if (!context) {
    throw new Error("ThreeDSecure.Frame must be used within an Evervault ThreeDSecure provider component");
  }

  return (
    <ThreeDSecureFrame sessionId={context.sessionId} />
  );
};

const ThreeDSecureNamespace = Object.assign(ThreeDSecure, {
  Frame: SessionFrame
});

export { ThreeDSecureNamespace as ThreeDSecure };