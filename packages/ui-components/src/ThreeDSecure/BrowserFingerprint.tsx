import { useEffect, useRef } from "react";
import { BrowserFingerprintNextAction } from "./types";
import { isTrampolineMessage, postRedirectFrame } from "./utilities";

interface BrowserFingerprintProps {
  action: BrowserFingerprintNextAction;
  onComplete: () => void;
  onTimeout: () => void;
}

export function BrowserFingerprint({
  action,
  onComplete,
  onTimeout,
}: BrowserFingerprintProps) {
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
      name="browserFingerprintFrame"
      allow="payment *; publickey-credentials-get *"
      sandbox="allow-forms allow-scripts allow-same-origin allow-pointer-lock"
      style={{
        width: 0,
        height: 0,
        opacity: 0,
        position: "absolute",
      }}
    />
  );
}
