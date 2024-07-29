import { useEffect, useRef, useState } from "react";
import {
  EvervaultFrameHostMessages,
  ThreeDSecureFrameClientMessages,
} from "types";
import { useMessaging } from "../utilities/useMessaging";
import { NextAction, TrampolineMessage } from "./types";
import { isTrampolineMessage, postRedirectFrame } from "./utilities";

export function ChallengeFrame({
  nextAction,
  onLoad,
}: {
  nextAction: NextAction;
  onLoad: () => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  const { send } = useMessaging<
    EvervaultFrameHostMessages,
    ThreeDSecureFrameClientMessages
  >();

  useEffect(() => {
    if (!frame.current) return;
    postRedirectFrame(frame.current, nextAction);

    const handleMessage = (e: MessageEvent) => {
      if (isTrampolineMessage(e)) {
        if (check3DSSuccess(e)) {
          send("EV_SUCCESS");
        } else {
          send("EV_FAILURE");
        }
      }
    };

    const handleFrameLoad = () => {
      setLoaded(true);
      onLoad();
    };

    frame.current.addEventListener("load", handleFrameLoad);
    window.addEventListener("message", handleMessage);
  }, []);

  return (
    <iframe
      ref={frame}
      name="challengeFrame"
      style={{
        width: loaded ? "100%" : 0,
        height: loaded ? "100%" : 0,
        border: "none",
      }}
    />
  );
}

function check3DSSuccess(message: TrampolineMessage): boolean {
  if (!message.data.cres) return false;
  try {
    const cres = JSON.parse(atob(message.data.cres)) as { transStatus: string };
    return cres.transStatus === "Y";
  } catch {
    return false;
  }
}
