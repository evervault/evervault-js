import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "../utilities/useSearchParams";

interface ProfilingSession {
  sessionId: string;
  nextAction: {
    type: "browser-fingerprint";
    url: string;
    data: string;
  };
}

interface BrowserFingerprintProps {
  session: ProfilingSession;
  onError: (error: Error) => void;
}

const API = import.meta.env.VITE_API_URL as string;

const PROFILING_TIMEOUT = 7500; // 7.5 seconds

function postRedirectFrame(
  frame: HTMLIFrameElement,
  url: string,
  data: Record<string, string>
) {
  const form = document.createElement("form");
  form.target = frame.name;
  form.method = "POST";
  form.action = url;

  Object.entries(data).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

async function updateProfilingSession(
  appId: string, 
  sessionId: string, 
  result: "complete" | "timeout",
): Promise<void> {
  const payload = {
    browserFingerprint: result,
  };

  const response = await fetch(`${API}/frontend/3ds/profiling/${sessionId}`, {
    method: "PATCH",
    headers: {
      "X-Evervault-App-Id": appId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to update profiling session: ${response.statusText}`);
  }
}

export function BrowserFingerprint({
  session,
  onError,
}: BrowserFingerprintProps) {
  const frame = useRef<HTMLIFrameElement>();
  const { app } = useSearchParams();
  
  const frameRef = useCallback(
    (node: HTMLIFrameElement) => {
      if (node && !frame.current) {
        frame.current = node;
        
        // Set a unique name for the frame
        node.name = `profiling_frame_${session.sessionId}`;
        
        // Post the profiling data to the issuer's endpoint
        try {
          postRedirectFrame(node, session.nextAction.url, {
            threeDSMethodData: session.nextAction.data,
          });
        } catch (error) {
          onError(error instanceof Error ? error : new Error("Failed to initialize profiling frame"));
        }
      }
    },
    [session, onError]
  );

  const handleProfilingComplete = useCallback(async (
    result: "complete" | "timeout", 
  ) => {
    try {
      if (app) {
        await updateProfilingSession(app, session.sessionId, result);
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error("Failed to update profiling session"));
    }
  }, [app, session.sessionId, onError]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      window.removeEventListener("message", messageListener);
      void handleProfilingComplete("timeout");
    }, PROFILING_TIMEOUT);
    const messageListener = () => {
        clearTimeout(timeout);
        window.removeEventListener("message", messageListener);
        void handleProfilingComplete("complete");
    };

    window.addEventListener("message", messageListener);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("message", messageListener);
    };
  }, [session.sessionId, handleProfilingComplete]);

  return (
    <iframe
      ref={frameRef}
      name={`profiling_frame_${session.sessionId}`}
      title="Card Network Profiling"
      allow="payment *; publickey-credentials-get *"
      sandbox="allow-forms allow-scripts allow-same-origin allow-pointer-lock"
      style={{
        width: 0,
        height: 0,
        opacity: 0,
        position: "absolute",
        left: "-9999px",
        top: "-9999px",
      }}
    />
  );
}