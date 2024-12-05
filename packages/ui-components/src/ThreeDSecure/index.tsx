import { useEffect, useRef, useState } from "react";
import { BrowserFingerprint } from "./BrowserFingerprint";
import { ChallengeFrame } from "./ChallengeFrame";
import { ThreeDSecureLoading } from "./Loading";
import { Overlay } from "./Overlay";
import { ThreeDSecureConfig } from "./types";
import {
  isChallengeAction,
  isBrowserFingerprintAction,
  useSession,
  useThreeDSMessaging,
} from "./utilities";

function defaultSize(): { width: string; height: string } {
  if (window.innerWidth < 500 || window.innerHeight < 600) {
    return { width: "96vw", height: "calc(100vh - 100px)" };
  }

  return { width: "500px", height: "600px" };
}

export function ThreeDSecure({ config }: { config: ThreeDSecureConfig }) {
  const { send } = useThreeDSMessaging();
  const container = useRef<HTMLDivElement>(null);
  const [challengeFrameReady, setChallengeFrameReady] = useState(false);
  const { session, refetch } = useSession(container, config.session);
  const size = config.size ?? defaultSize();

  const handleTimeout = () => {
    void refetch({ browserFingerprint: "timeout" });
  };

  const handleFingerprintComplete = () => {
    void refetch({ browserFingerprint: "complete" });
  };

  const handleCancel = () => {
    send("EV_CANCEL");
  };

  useEffect(() => {
    if (session?.status === "success") {
      send("EV_SUCCESS");
    }

    if (session?.status === "failure") {
      send("EV_FAILURE");
    }

    if (isChallengeAction(session?.nextAction) && config.failOnChallenge) {
      send("EV_FAIL_ON_CHALLENGE");
    }
  }, [session]);

  return (
    <Overlay enabled={config.isOverlay} onCancel={handleCancel}>
      <div ref={container} style={size}>
        {(!isChallengeAction(session?.nextAction) || !challengeFrameReady) && (
          <ThreeDSecureLoading session={config.session} />
        )}

        {isBrowserFingerprintAction(session?.nextAction) && (
          <BrowserFingerprint
            action={session.nextAction}
            onComplete={handleFingerprintComplete}
            onTimeout={handleTimeout}
          />
        )}

        {isChallengeAction(session?.nextAction) && !config.failOnChallenge && (
          <ChallengeFrame
            nextAction={session.nextAction}
            onLoad={() => setChallengeFrameReady(true)}
          />
        )}
      </div>
    </Overlay>
  );
}
