import { useEffect, useRef } from "react";
import { IssuerFingerprintNextAction } from "./types";
import { isTrampolineMessage, postRedirectFrame } from "./utilities";

interface IssuerFingerprintProps {
  action: IssuerFingerprintNextAction;
  onComplete: () => void;
  onTimeout: () => void;
}

export function IssuerFingerprint({
  action,
  onComplete,
  onTimeout,
}: IssuerFingerprintProps) {
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!frame.current) return;
    postRedirectFrame(frame.current, action.url, { data: action.data });

    const handleMessage = (e: MessageEvent) => {
      if (isTrampolineMessage(e)) {
        onComplete();
      }
    };

    const timeout = setTimeout(onTimeout, 5000);
    window.addEventListener("message", handleMessage);

    // eslint-disable-next-line consistent-return
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <iframe
      ref={frame}
      name="issuerFingerprintFrame"
      style={{
        width: 0,
        height: 0,
        opacity: 0,
        position: "absolute",
      }}
    />
  );
}
