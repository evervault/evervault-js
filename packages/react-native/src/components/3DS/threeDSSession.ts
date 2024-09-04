import {
  ThreeDSecureCallbacks,
  ThreeDSecureSessionsParams,
  ThreeDSecureSession,
  ThreeDSecureSessionResponse,
} from "./types";
import { EV_API_DOMAIN } from "./config";

export const startSession = async (
  session: ThreeDSecureSession,
  callbacks: ThreeDSecureCallbacks,
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>,
  setDisplayModal: (show: boolean) => void
) => {
  try {
    const sessionState = await session.get();

    switch (sessionState.status) {
      case "success":
        setDisplayModal(false);
        callbacks.onSuccess();
        break;
      case "failure":
        setDisplayModal(false);
        callbacks.onFailure(new Error("3DS session failed"));
        break;
      case "action-required":
        setDisplayModal(true);
        pollSession(session, callbacks, intervalRef, setDisplayModal);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error("Error checking session state", error);
    callbacks.onError(new Error("Failed to check 3DS session state"));
  }
};

export const pollSession = (
  session: ThreeDSecureSession,
  callbacks: ThreeDSecureCallbacks,
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>,
  setDisplayModal: (show: boolean) => void,
  interval: number = 3000
) => {
  intervalRef.current = setInterval(async () => {
    try {
      const pollResponse: ThreeDSecureSessionResponse = await session.get();
      if (pollResponse.status === "success") {
        setDisplayModal(false);
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        callbacks.onSuccess();
      } else if (pollResponse.status === "failure") {
        setDisplayModal(false);
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        callbacks.onFailure(new Error("3DS session failed"));
      } else {
        setDisplayModal(true);
      }
    } catch (error) {
      setDisplayModal(false);
      console.error("Error polling session", error);
      clearInterval(intervalRef.current!);
      intervalRef.current = null;
      callbacks.onError(new Error("Error polling 3DS session"));
    }
  }, interval);
};

export function threeDSecureSession({
  sessionId,
  appId,
  callbacks,
  intervalRef,
  setDisplayModal,
}: ThreeDSecureSessionsParams): ThreeDSecureSession {
  const get = async (): Promise<ThreeDSecureSessionResponse> => {
    try {
      const response = await fetch(
        `https://${EV_API_DOMAIN}/frontend/3ds/browser-sessions/${sessionId}`,
        {
          headers: {
            "x-evervault-app-id": appId,
          },
        }
      );

      const result = (await response.json()) as ThreeDSecureSessionResponse;
      return result;
    } catch (error) {
      console.error("Error fetching 3DS session status", error);
      throw error;
    }
  };

  const cancel = async (): Promise<void> => {
    try {
      await fetch(
        `https://${EV_API_DOMAIN}/frontend/3ds/browser-sessions/${sessionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-evervault-app-id": appId,
          },
          body: JSON.stringify({ outcome: "cancelled" }),
        }
      );

      callbacks.onFailure(new Error("3DS session cancelled by user"));
      setDisplayModal(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    } catch (error) {
      console.error("Error cancelling 3DS session", error);
      throw error;
    }
  };

  return {
    sessionId,
    get,
    cancel,
  } as ThreeDSecureSession;
}
