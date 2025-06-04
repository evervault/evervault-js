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
  const frame = useRef<HTMLIFrameElement>();
  const frameRef = useCallback(
    (node: HTMLIFrameElement) => {
      if (!frame.current) {
        postRedirectFrame(node, action.url, {
          threeDSMethodData: action.data,
        });
      }
      frame.current = node;
    },
    [action.data, action.url]
  );

  useEffect(() => {
    const timeout: { current?: NodeJS.Timeout } = {};

    const handleMessage = (e: MessageEvent) => {
      if (isTrampolineMessage(e)) {
        onComplete();
        if (timeout.current) clearTimeout(timeout.current);
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
