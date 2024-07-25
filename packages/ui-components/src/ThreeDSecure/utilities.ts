import { useEffect, useState } from "react";
import {
  EvervaultFrameHostMessages,
  ThreeDSecureFrameClientMessages,
} from "types";
import { useMessaging } from "../utilities/useMessaging";
import { useSearchParams } from "../utilities/useSearchParams";
import { NextAction, TrampolineMessage } from "./types";

const API = import.meta.env.VITE_API_URL as string;

export async function getBrowserSession(
  app: string,
  id: string
): Promise<NextAction> {
  const response = await fetch(`${API}/frontend/3ds/browser-sessions/${id}`, {
    method: "PATCH",
    headers: {
      "X-Evervault-App-Id": app,
    },
  });

  if (!response.ok) {
    throw new Error();
  }

  const data = (await response.json()) as { next_action: NextAction };
  return data.next_action;
}

export function useNextAction(session: string): NextAction | null {
  const { app } = useSearchParams();
  const [action, setAction] = useState<NextAction | null>(null);

  const { send } = useMessaging<
    EvervaultFrameHostMessages,
    ThreeDSecureFrameClientMessages
  >();

  useEffect(() => {
    const load = async () => {
      try {
        const nextAction = await getBrowserSession(app, session);
        setAction(nextAction);
      } catch (error) {
        send("EV_ERROR", {
          code: "session-not-found",
          message:
            "Failed to fetch 3DS Session. Please ensure you are passing a valid 3DS Session ID.",
        });
      }
    };

    void load();
  }, []);

  return action;
}

export function postRedirectFrame(
  frame: HTMLIFrameElement,
  nextAction: NextAction
) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = nextAction.url;
  form.target = frame.name;
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "creq";
  input.value = nextAction.creq;
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
}

export function isTrampolineMessage(
  message: MessageEvent
): message is TrampolineMessage {
  return (message as TrampolineMessage).data?.event === "ev-3ds-trampoline";
}
