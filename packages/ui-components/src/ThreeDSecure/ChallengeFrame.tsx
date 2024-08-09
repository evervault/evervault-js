import { useEffect, useRef, useState } from "react";
import { ChallengeNextAction, TrampolineMessage } from "./types";
import {
  isTrampolineMessage,
  postRedirectFrame,
  useThreeDSMessaging,
} from "./utilities";

export function ChallengeFrame({
  nextAction,
  onLoad,
}: {
  nextAction: ChallengeNextAction;
  onLoad: () => void;
}) {
  const initialized = useRef(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const { send } = useThreeDSMessaging();

  useEffect(() => {
    if (!frame.current) return;

    if (!initialized.current) {
      initialized.current = true;
      postRedirectFrame(frame.current, nextAction.url, {
        creq: nextAction.creq,
      });
    }

    const handleMessage = (e: MessageEvent) => {
      if (isTrampolineMessage(e)) {
        if (check3DSSuccess(e)) {
          send("EV_SUCCESS", cresForOutcome(e.data.cres));
        } else {
          send("EV_FAILURE", cresForOutcome(e.data.cres));
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
      allow="payment *; publickey-credentials-get *"
      sandbox="allow-forms allow-scripts allow-same-origin allow-pointer-lock"
      style={{
        width: loaded ? "100%" : 0,
        height: loaded ? "100%" : 0,
        border: "none",
      }}
    />
  );
}

function cresForOutcome(cres: string | null): string | null {
  if (!cres) return null;

  try {
    return atob(cres);
  } catch {
    return cres;
  }
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
