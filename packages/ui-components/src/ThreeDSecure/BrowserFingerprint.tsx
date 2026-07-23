import { useCallback, useEffect, useRef } from "react";
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
  const postedData = useRef<string | null>(null);
  const frameRef = useCallback(
    (node: HTMLIFrameElement) => {
      if (!node) return;
      if (postedData.current === action.data) return;
      postedData.current = action.data;
      postRedirectFrame(node, action.url, { threeDSMethodData: action.data });
    },
    [action.data, action.url]
  );

  useEffect(() => {
    const timeout: { current?: NodeJS.Timeout } = {};

    const handleMessage = (e: MessageEvent) => {
      if (isTrampolineMessage(e)) {
        window.removeEventListener("message", handleMessage);
        if (timeout.current) clearTimeout(timeout.current);
        onComplete();
      }
    };

    window.addEventListener("message", handleMessage);

    timeout.current = setTimeout(() => {
      window.removeEventListener("message", handleMessage);
      onTimeout();
    }, THREE_DS_METHOD_TIMEOUT);

    return () => {
      if (timeout.current) clearTimeout(timeout.current);
      window.removeEventListener("message", handleMessage);
    };
  }, [onComplete, onTimeout]);

  return (
    <iframe
      ref={frameRef}
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
