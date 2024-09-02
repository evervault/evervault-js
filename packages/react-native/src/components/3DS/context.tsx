import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { ThreeDSCallbacks, ThreeDSSessionResponse } from "./types"; // Assuming you have defined these types
import ThreeDSSession, { threeDSSession } from "./threeDSSession";
import { useEvervault } from "../EvervaultProvider";
import { ThreeDSFrame } from "./ThreeDSFrame";

interface ThreeDSContextType {
    sessionId: string;
    callbacks: ThreeDSCallbacks;
    intervalRef: React.MutableRefObject<NodeJS.Timeout | null>; // Shared interval ref
  }

export const ThreeDSContext = createContext<ThreeDSContextType | undefined>(
  undefined
);

function startPollingSession(
    session: ThreeDSSession,
    callbacks: ThreeDSCallbacks,
    setShouldShow3DSFrame: (show: boolean) => void,
    intervalRef: React.MutableRefObject<NodeJS.Timeout | null>
  ) {
    intervalRef.current = setInterval(async () => {
      try {
        const pollResponse: ThreeDSSessionResponse = await session.get();
        if (pollResponse.status === "success") {
          setShouldShow3DSFrame(false);
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          callbacks.onSuccess();
        } else if (pollResponse.status === "failure") {
          setShouldShow3DSFrame(false);
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          callbacks.onFailure(new Error("3DS session failed"));
        }
      } catch (error) {
        console.error("Error polling session", error);
        setShouldShow3DSFrame(false);
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        callbacks.onFailure(new Error("Error polling 3DS session"));
      }
    }, 3000);
  }

function useThreeDSInternal(poll: boolean = true) {
  const { appUuid } = useEvervault();
  const context = useContext(ThreeDSContext);

  if (!appUuid) {
    throw new Error("useThreeDS must be used within an Evervault Provider");
  }
  
  if (!context) {
    throw new Error("useThreeDS must be used within a ThreeDS Provider");
  }

  const { sessionId, callbacks, intervalRef} = context;
  const [shouldShow3DSFrame, setShouldShow3DSFrame] = useState(false);

  const session = threeDSSession(sessionId, appUuid);

  useEffect(() => {
    if (!poll) {
      return;
    }

    const session = threeDSSession(sessionId, appUuid);

    const checkForActionRequired = async () => {
      try {
        const sessionState = await session.get();

        switch (sessionState.status) {
          case "success":
            setShouldShow3DSFrame(false);
            callbacks.onSuccess();
            break;
          case "failure":
            setShouldShow3DSFrame(false);
            callbacks.onFailure(new Error("3DS session failed"));
            break;
          case "action-required":
            setShouldShow3DSFrame(true);
            startPollingSession(session, callbacks, setShouldShow3DSFrame, intervalRef);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error("Error checking session state", error);
        callbacks.onFailure(new Error("Failed to check 3DS session state"));
      }
    };

    checkForActionRequired();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

  }, [sessionId, appUuid]);

  const updatedSession: ThreeDSSession = {
    ...session,
    cancel: async () => {
      try {
        setShouldShow3DSFrame(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        callbacks.onCancel();
        await session.cancel();
      } catch (error) {
        console.error("Error cancelling 3DS session.", error);
        throw error;
      }
    },
  };

  return { session: updatedSession, callbacks, shouldShow3DSFrame };
}

/*
    This hook is used to start the 3DS flow and handle the polling of the session.
    It will return the session object and a boolean to determine if the 3DS frame should be shown.
*/
export const useThreeDS = () => useThreeDSInternal(true);

export const useThreeDSSession = () => useThreeDSInternal(false);

interface ThreeDSProps {
  sessionId: string;
  callbacks: ThreeDSCallbacks;
  children: ReactNode;
}

function ThreeDS({ sessionId, callbacks, children }: ThreeDSProps) {
    const intervalRef = useRef<NodeJS.Timeout | null>(null); // Create a shared interval ref
  
    const value = {
      sessionId,
      callbacks,
      intervalRef,
    };
  
    return (
      <ThreeDSContext.Provider value={value}>
        {children}
      </ThreeDSContext.Provider>
    );
  }


export const ThreeDSNamespace = Object.assign(ThreeDS, {
    Frame: ThreeDSFrame
});