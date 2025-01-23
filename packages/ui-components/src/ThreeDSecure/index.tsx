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
  const { send, on } = useThreeDSMessaging();
  const container = useRef<HTMLDivElement>(null);
  const [challengeFrameReady, setChallengeFrameReady] = useState(false);
  const { session, refetch } = useSession(container, config.session);
  const size = config.size ?? defaultSize();
  const [failOnChallenge, setFailOnChallenge] = useState(
    config.failOnChallenge ?? false
  );

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
      // if next step is challenge, and the failOnChallenge config has been passed,
      // call up to the parent to see if the challenge should be shown.
      on("EV_FAIL_ON_CHALLENGE_RESULT", (shouldFail) => {
        if (shouldFail) {
          send("EV_FAILURE_FORCED_DUE_TO_CHALLENGE");
        } else {
          setFailOnChallenge(false);
        }
      });

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

        {isChallengeAction(session?.nextAction) && !failOnChallenge && (
          <ChallengeFrame
            nextAction={session.nextAction}
            onLoad={() => setChallengeFrameReady(true)}
          />
        )}
      </div>
    </Overlay>
  );
}
