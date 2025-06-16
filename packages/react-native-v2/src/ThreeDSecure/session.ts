import {
  ThreeDSecureCallbacks,
  ThreeDSecureSessionsParams,
  ThreeDSecureSession,
  ThreeDSecureSessionResponse,
  ThreeDSecureOptions,
} from "./types";
import { EV_API_DOMAIN } from "./config";
import { ThreeDSecureEvent } from "./event";

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
  options: ThreeDSecureOptions | undefined,
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>,
  setIsVisible: (show: boolean) => void
) {
  try {
    const sessionState = await session.get();

    function fail() {
      stopPolling(intervalRef, setIsVisible);
      options?.onFailure?.(new Error("3DS session failed"));
    }

    switch (sessionState.status) {
      case "success": {
        stopPolling(intervalRef, setIsVisible);
        options?.onSuccess?.();
        break;
      }

      case "failure": {
        fail();
        break;
      }

      case "action-required": {
        const failOnChallenge =
          typeof options?.failOnChallenge === "function"
            ? await options.failOnChallenge()
            : options?.failOnChallenge ?? false;
        if (failOnChallenge) {
          fail();
          break;
        }

        const event = new ThreeDSecureEvent("requestChallenge", session);
        options?.onRequestChallenge?.(event);
        if (event.defaultPrevented) {
          fail();
          break;
        }

        setIsVisible(true);
        pollSession(session, options, intervalRef, setIsVisible);
      }
    }
  } catch (error) {
    console.error("Error checking session state", error);
    options?.onError?.(new Error("Failed to check 3DS session state"));
  }
}

export function pollSession(
  session: ThreeDSecureSession,
  options: ThreeDSecureOptions | undefined,
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>,
  setIsVisible: (show: boolean) => void,
  interval = 3000
) {
  function fail() {
    stopPolling(intervalRef, setIsVisible);
    options?.onFailure?.(new Error("3DS session failed"));
  }

  intervalRef.current = setInterval(async () => {
    try {
      const pollResponse: ThreeDSecureSessionResponse = await session.get();
      switch (pollResponse.status) {
        case "success": {
          stopPolling(intervalRef, setIsVisible);
          options?.onSuccess?.();
          break;
        }

        case "failure": {
          fail();
          break;
        }

        case "action-required": {
          const failOnChallenge =
            typeof options?.failOnChallenge === "function"
              ? await options.failOnChallenge()
              : options?.failOnChallenge ?? false;
          if (failOnChallenge) {
            fail();
            break;
          }

          const event = new ThreeDSecureEvent("requestChallenge", session);
          options?.onRequestChallenge?.(event);
          if (event.defaultPrevented) {
            fail();
            break;
          }

          setIsVisible(true);
        }
      }
    } catch (error) {
      stopPolling(intervalRef, setIsVisible);
      console.error("Error polling session", error);
      options?.onError?.(new Error("Error polling 3DS session"));
    }
  }, interval);
}

export function threeDSecureSession({
  sessionId,
  appId,
  options,
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

      options?.onFailure?.(new Error("3DS session cancelled by user"));
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
