import { useEffect, useState } from "react";
import { useRef } from "react";
import { useEvervault } from "../EvervaultProvider";
import { startSession, threeDSecureSession } from "./threeDSSession";
import {
  ThreeDSecureCallbacks,
  UseThreeDSecureResponse,
  UseThreeDSecureState,
} from "./types";

export const useThreeDSecure = (): UseThreeDSecureResponse => {
  const { appUuid } = useEvervault();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [displayModal, setDisplayModal] = useState(false);
  const [state, setState] = useState<UseThreeDSecureState>({
    session: null,
    displayModal,
  });

  useEffect(() => {
    setState((prevState) => ({
      ...prevState,
      displayModal,
    }));
  }, [displayModal]);

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
      setDisplayModal,
    });

    setState((prevState) => ({
      ...prevState,
      session,
    }));

    startSession(session, callbacks, intervalRef, setDisplayModal);
  };

  const cancel = async () => {
    if (state.session) {
      await state.session.cancel();
    } else {
      console.warn("No 3DS session to cancel");
    }
  };

  return {
    start,
    cancel,
    ...state,
  };
};
