import { useEffect, useRef } from "react";
import { BrowserFingerprintNextAction } from "./types";
import { isTrampolineMessage, postRedirectFrame } from "./utilities";

interface BrowserFingerprintProps {
  action: BrowserFingerprintNextAction;
  onComplete: () => void;
  onTimeout: () => void;
}

const THREE_DS_METHOD_TIMEOUT = 7500;

export function BrowserFingerprint({
  action,
  onComplete,
  onTimeout,
}: BrowserFingerprintProps) {
  const initialized = useRef(false);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!frame.current) return;

    if (!initialized.current) {
      initialized.current = true;
      postRedirectFrame(frame.current, action.url, {
        threeDSMethodData: action.data,
      });
    }

    const timeout = setTimeout(() => {
      window.removeEventListener("message", handleMessage);
      onTimeout();
    }, THREE_DS_METHOD_TIMEOUT);

    const handleMessage = (e: MessageEvent) => {
      if (isTrampolineMessage(e)) {
        onComplete();
        clearTimeout(timeout);
      }
    };

    window.addEventListener("message", handleMessage);

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
