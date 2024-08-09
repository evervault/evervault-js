import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import {
  EvervaultFrameHostMessages,
  ThreeDSecureFrameClientMessages,
} from "types";
import { useMessaging } from "../utilities/useMessaging";
import { useSearchParams } from "../utilities/useSearchParams";
import {
  ChallengeNextAction,
  BrowserFingerprintNextAction,
  NextAction,
  SessionData,
  TrampolineMessage,
} from "./types";

const API = import.meta.env.VITE_API_URL as string;

class SessionError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "SessionError";
    this.code = code;
  }
}

export async function getBrowserSession(
  app: string,
  id: string,
  payload: object
): Promise<SessionData> {
  const response = await fetch(`${API}/frontend/3ds/browser-sessions/${id}`, {
    method: "PATCH",
    headers: {
      "X-Evervault-App-Id": app,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw new SessionError(
        "session-complete",
        "The session has already been completed (either successfully or unsuccessfully). Therefore, rendering the 3DS screen is not required."
      );
    }

    throw new SessionError(
      "session-not-found",
      "Failed to fetch 3DS Session. Please ensure you are passing a valid 3DS Session ID."
    );
  }

  return (await response.json()) as SessionData;
}

export function useThreeDSMessaging() {
  return useMessaging<
    EvervaultFrameHostMessages,
    ThreeDSecureFrameClientMessages
  >();
}

interface UseSessionReturn {
  session: SessionData | null;
  refetch: (payload: object) => Promise<void>;
}

export function useSession(
  container: RefObject<HTMLDivElement>,
  id: string
): UseSessionReturn {
  const initialized = useRef(false);
  const { app } = useSearchParams();
  const [session, setSession] = useState<SessionData | null>(null);
  const { send } = useThreeDSMessaging();

  const fetchAction = useCallback(
    async (payload: object) => {
      try {
        const data = await getBrowserSession(app, id, payload);
        setSession(data);
      } catch (error) {
        if (error instanceof SessionError) {
          send("EV_ERROR", {
            code: error.code,
            message: error.message,
          });
        } else {
          send("EV_ERROR", {
            code: "something-went-wrong",
            message: "An unexpected error occurred. Please try again.",
          });
        }
      }
    },
    [app, id, send]
  );

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const width = container.current?.clientWidth ?? null;
    const height = container.current?.clientHeight ?? null;

    void fetchAction({
      frame: { width, height },
      browser: {
        javaEnabled: window.navigator.javaEnabled(),
        javaScriptEnabled: true,
        language: navigator.language,
        colorDepth: window.screen.colorDepth,
        screenHeight: window.screen.height,
        screenWidth: window.screen.width,
        timeZone: new Date().getTimezoneOffset(),
      },
    });
  }, []);

  return {
    session,
    refetch: fetchAction,
  };
}

export function postRedirectFrame(
  frame: HTMLIFrameElement,
  url: string,
  data: Record<string, string>
) {
  const form = document.createElement("form");
  form.target = frame.name;
  form.method = "POST";
  form.action = url;

  Object.entries(data).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

export function isTrampolineMessage(
  message: MessageEvent
): message is TrampolineMessage {
  return (message as TrampolineMessage).data?.event === "ev-3ds-trampoline";
}

export function isChallengeAction(
  action?: NextAction | null
): action is ChallengeNextAction {
  return action?.type === "challenge";
}

export function isBrowserFingerprintAction(
  action?: NextAction | null
): action is BrowserFingerprintNextAction {
  return action?.type === "browser-fingerprint";
}
