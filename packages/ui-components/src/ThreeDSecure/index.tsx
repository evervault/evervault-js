import { ReactNode, useEffect, useRef, useState } from "react";
import { useSearchParams } from "../utilities/useSearchParams";
import { ChallengeFrame } from "./ChallengeFrame";
import { ThreeDSecureLoading } from "./Loading";
import { ThreeDSecureConfig } from "./types";

export function ThreeDSecure({ config }: { config: ThreeDSecureConfig }) {
  const { app } = useSearchParams();
  const called = useRef(false);
  const [loading, setLoading] = useState(true);
  const [redirect, setRedirect] = useState(null);
  const size = config.size ?? { width: 500, height: 600 };

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    async function getNextAction() {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/frontend/3ds/browser-sessions/${
          config.session
        }`,
        {
          method: "PATCH",
          headers: {
            "X-Evervault-App-Id": app,
          },
        }
      );

      const data = await response.json();

      setRedirect({
        url: data.next_action.url,
        creq: data.next_action.creq,
      });
    }

    void getNextAction();
  }, []);

  return (
    <Overlay enabled={config.isOverlay}>
      <div style={size}>
        {loading && <ThreeDSecureLoading session={config.session} />}
        {redirect && (
          <ChallengeFrame
            url={redirect.url}
            creq={redirect.creq}
            onLoad={() => setLoading(false)}
          />
        )}
      </div>
    </Overlay>
  );
}

function Overlay({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  if (!enabled) return children;

  return (
    <div ev-overlay="" className="overlay">
      <div className="overlayWindow">{children}</div>
    </div>
  );
}
