import { useCallback, useEffect, useRef, useState } from "react";
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

  const handleChallengeFrameLoad = useCallback(() => {
    setChallengeFrameReady(true);
  }, []);

  const handleTimeout = useCallback(() => {
    void refetch({ browserFingerprint: "timeout" });
  }, [refetch]);

  const handleFingerprintComplete = useCallback(() => {
    void refetch({ browserFingerprint: "complete" });
  }, [refetch]);

  const handleCancel = useCallback(() => {
    send("EV_CANCEL");
  }, [send]);

  useEffect(() => {
    if (session?.status === "success") {
      send("EV_SUCCESS");
    } else if (session?.status === "failure") {
      send("EV_FAILURE");
    }
  }, [session?.status, send]);

  useEffect(() => {
    if (isChallengeAction(session?.nextAction) && config.failOnChallenge) {
      // if next step is challenge, and the failOnChallenge config has been passed,
      // call up to the parent to see if the challenge should be shown.
      const unsubscribe = on("EV_FAIL_ON_CHALLENGE_RESULT", (shouldFail) => {
        if (shouldFail) {
          send("EV_FAILURE_FORCED_DUE_TO_CHALLENGE");
        } else {
          setFailOnChallenge(false);
        }
      });

      send("EV_FAIL_ON_CHALLENGE");

      return () => unsubscribe();
    }
  }, [session?.nextAction, config.failOnChallenge, send, on]);

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
            onLoad={handleChallengeFrameLoad}
          />
        )}
      </div>
    </Overlay>
  );
}
