import { useState } from "react";
import { useRef } from "react";
import { useEvervault } from "../EvervaultProvider";
import { startSession, threeDSecureSession } from "./threeDSSession";
import { ThreeDSecureCallbacks, ThreeDSecureSession } from "./types";

export const useThreeDSecure = (
  sessionId: string,
  callbacks: ThreeDSecureCallbacks
): ThreeDSecureSession => {
  const { appUuid } = useEvervault();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [displayModal, setDisplayModal] = useState(false);

  if (!appUuid) {
    throw new Error("useThreeDS must be used within an Evervault Provider");
  }

  const session = threeDSecureSession({
    sessionId,
    appId: appUuid,
    callbacks,
    intervalRef,
    setDisplayModal,
  });

  const start = () =>
    startSession(session, callbacks, intervalRef, setDisplayModal);

  return {
    ...session,
    start,
    displayModal,
  };
};
