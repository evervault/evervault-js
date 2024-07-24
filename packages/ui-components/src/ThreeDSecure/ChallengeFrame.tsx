import { useEffect, useRef, useState } from "react";
import {
  EvervaultFrameHostMessages,
  ThreeDSecureFrameClientMessages,
} from "types";
import { useMessaging } from "../utilities/useMessaging";
import { NextAction } from "./types";
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
        send("EV_COMPLETE");
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
