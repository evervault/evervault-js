import {
  ThreeDSecureCallbacks,
  ThreeDSecureSessionsParams,
  ThreeDSecureSession,
  ThreeDSecureSessionResponse,
} from "./types";
import { EV_API_DOMAIN } from "./config";

export function stopPolling(
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>,
  setIsVisible: (show: boolean) => void
) {
  setIsVisible(false);

  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }
}

export async function startSession(
  session: ThreeDSecureSession,
  callbacks: ThreeDSecureCallbacks | undefined,
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>,
  setIsVisible: (show: boolean) => void
) {
  try {
    const sessionState = await session.get();

    switch (sessionState.status) {
      case "success":
        stopPolling(intervalRef, setIsVisible);
        callbacks?.onSuccess?.();
        break;
      case "failure":
        stopPolling(intervalRef, setIsVisible);
        callbacks?.onFailure?.(new Error("3DS session failed"));
        break;
      case "action-required":
        setIsVisible(true);
        pollSession(session, callbacks, intervalRef, setIsVisible);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error("Error checking session state", error);
    callbacks?.onError?.(new Error("Failed to check 3DS session state"));
  }
}

export function pollSession(
  session: ThreeDSecureSession,
  callbacks: ThreeDSecureCallbacks | undefined,
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>,
  setIsVisible: (show: boolean) => void,
  interval = 3000
) {
  intervalRef.current = setInterval(async () => {
    try {
      const pollResponse: ThreeDSecureSessionResponse = await session.get();
      if (pollResponse.status === "success") {
        stopPolling(intervalRef, setIsVisible);
        callbacks?.onSuccess?.();
      } else if (pollResponse.status === "failure") {
        stopPolling(intervalRef, setIsVisible);
        callbacks?.onFailure?.(new Error("3DS session failed"));
      } else {
        setIsVisible(true);
      }
    } catch (error) {
      stopPolling(intervalRef, setIsVisible);
      console.error("Error polling session", error);
      callbacks?.onError?.(new Error("Error polling 3DS session"));
    }
  }, interval);
}

export function threeDSecureSession({
  sessionId,
  appId,
  callbacks,
  intervalRef,
  setIsVisible,
}: ThreeDSecureSessionsParams): ThreeDSecureSession {
  async function get(): Promise<ThreeDSecureSessionResponse> {
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
  }

  async function cancel(): Promise<void> {
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

      callbacks?.onFailure?.(new Error("3DS session cancelled by user"));
      stopPolling(intervalRef, setIsVisible);
    } catch (error) {
      console.error("Error cancelling 3DS session", error);
      throw error;
    }
  }

  return {
    sessionId,
    get,
    cancel,
  };
}
