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

interface ThreeDSContextType {
  sessionId: string;
  callbacks: ThreeDSCallbacks;
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

export function useThreeDS() {
  const { appUuid } = useEvervault();
  const context = useContext(ThreeDSContext);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  if (!appUuid) {
    throw new Error("useThreeDS must be used within an Evervault Provider");
  }
  
  if (!context) {
    throw new Error("useThreeDS must be used within a ThreeDS Provider");
  }

  const { sessionId, callbacks } = context;
  const [shouldShow3DSFrame, setShouldShow3DSFrame] = useState(false);

  const session = threeDSSession(sessionId, appUuid);

  useEffect(() => {
    const session = threeDSSession(sessionId, appUuid);

    const checkForActionRequired = async () => {
      try {
        const sessionState = await session.get();
        console.log("Session state", sessionState);

        switch (sessionState.status) {
          case "success":
            callbacks.onSuccess();
            break;
          case "failure":
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
        console.log("Cancel 3DS session called. Cancelling 3DS session and stopping polling");
        setShouldShow3DSFrame(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        callbacks.onCancel();
        await session.cancel();
      } catch (error) {
        console.error("Error cancelling 3DS session", error);
        throw error;
      }
    },
  };

  return { session: updatedSession, callbacks, shouldShow3DSFrame };
}

interface ThreeDSProps {
  sessionId: string;
  callbacks: ThreeDSCallbacks;
  children: ReactNode;
}

export function ThreeDS({ sessionId, callbacks, children }: ThreeDSProps) {
  const value = { sessionId, callbacks };

  return (
    <ThreeDSContext.Provider value={value}>{children}</ThreeDSContext.Provider>
  );
}
