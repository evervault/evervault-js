import { useEffect, useRef, useState } from "react";
import {
  EvervaultFrameHostMessages,
  ThreeDSecureFrameClientMessages,
} from "types";
import { useMessaging } from "../utilities/useMessaging";

export function ChallengeFrame({
  url,
  creq,
  onLoad,
}: {
  url: string;
  creq: string;
  onLoad: () => void;
}) {
  const frame = useRef(null);
  const called = useRef(false);
  const [loaded, setLoaded] = useState(false);

  const { send } = useMessaging<
    EvervaultFrameHostMessages,
    ThreeDSecureFrameClientMessages
  >();

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const form = document.createElement("form");
    form.method = "POST";
    form.action = url;
    form.target = "challengeFrame";
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "creq";
    input.value = creq;
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();

    const handleMessage = (e) => {
      const event = e.data.event;

      if (event === "ev-3ds-trampoline") {
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
