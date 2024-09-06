import React, { createContext, useContext } from "react";
import { ThreeDSecureProviderProps } from "./types";
import { useEvervault } from "../EvervaultProvider";
import { ThreeDSecureFrame } from "./ThreeDSecureFrame";
import { ThreeDSecureModal } from "./ThreeDSecureModal";
import { ThreeDSecureContext } from "./context";


const ThreeDSecure = ({ state, children }: ThreeDSecureProviderProps) => {
  const { appUuid } = useEvervault();

  if (!appUuid) {
    throw new Error("ThreeDSecure must be used within an Evervault Provider");
  }

  const { session, displayModal } = state;

  if (!session) return null;

  return (
    <ThreeDSecureContext.Provider value={state}>
      {displayModal && children}
    </ThreeDSecureContext.Provider>
  );
};



const ThreeDSecureNamespace = Object.assign(ThreeDSecure, {
  Frame: ThreeDSecureFrame,
  Modal: ThreeDSecureModal
});

export { ThreeDSecureNamespace as ThreeDSecure };