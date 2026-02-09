import { useCallback, useEffect, useRef, useState } from "react";
import { ChallengeNextAction, TrampolineMessage } from "./types";
import {
  isTrampolineMessage,
  postRedirectFrame,
  useThreeDSMessaging,
} from "./utilities";

export interface ChallengeFrameProps {
  nextAction: ChallengeNextAction;
  onLoad(): void;
}

export function ChallengeFrame({ nextAction, onLoad }: ChallengeFrameProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const frameRef = useCallback(
    (node: HTMLIFrameElement) => {
      if (!frame.current) {
        postRedirectFrame(node, nextAction.url, {
          creq: nextAction.creq,
        });
      }
      frame.current = node;
    },
    [nextAction.creq, nextAction.url]
  );

  const [loaded, setLoaded] = useState(false);
  const { send } = useThreeDSMessaging();

  const onFrameLoad = useCallback(() => {
    setLoaded(true);
    onLoad();
  }, [onLoad]);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (isTrampolineMessage(e)) {
        if (check3DSSuccess(e)) {
          send("EV_SUCCESS", cresForOutcome(e.data.cres));
        } else {
          send("EV_FAILURE", cresForOutcome(e.data.cres));
        }
      }
    }

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [send]);

  return (
    <iframe
      ref={frameRef}
      onLoad={onFrameLoad}
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
