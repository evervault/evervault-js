import { useCallback, useEffect, useRef, useState } from "react";
import { ChallengeFrame } from "../ThreeDSecure/ChallengeFrame";
import { ThreeDSecureLoading } from "../ThreeDSecure/Loading";
import { Overlay } from "../ThreeDSecure/Overlay";
import { useThreeDSMessaging } from "../ThreeDSecure/utilities";
import { useProfiledSession } from "./useProfiledSession";
import type { ThreeDSecureWithProfilingConfig } from "./types";
import { ChallengeNextAction } from "../ThreeDSecure/types";

function defaultSize(): { width: string; height: string } {
  if (window.innerWidth < 500 || window.innerHeight < 600) {
    return { width: "96vw", height: "calc(100vh - 100px)" };
  }

  return { width: "500px", height: "600px" };
}

export function ThreeDSecureWithProfiling({
  config,
}: {
  config: ThreeDSecureWithProfilingConfig;
}) {
  const { send, on } = useThreeDSMessaging();
  const container = useRef<HTMLDivElement>(null);
  const [challengeFrameReady, setChallengeFrameReady] = useState(false);
  const { session, error } = useProfiledSession(config.session);
  const size = config.size ?? defaultSize();
  const [failOnChallenge, setFailOnChallenge] = useState(
    config.failOnChallenge ?? false
  );

  const handleChallengeFrameLoad = useCallback(() => {
    setChallengeFrameReady(true);
  }, []);

  const handleCancel = useCallback(() => {
    send("EV_CANCEL");
  }, [send]);

  // Handle session completion states
  useEffect(() => {
    if (session?.status === "success") {
      send("EV_SUCCESS");
    } else if (session?.status === "failure") {
      send("EV_FAILURE");
    }
  }, [session?.status, send]);

  // Handle failOnChallenge logic
  useEffect(() => {
    if (session?.nextAction?.type === "challenge" && config.failOnChallenge) {
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

  // Handle errors
  useEffect(() => {
    if (error) {
      send("EV_ERROR", {
        code: "session-error",
        message: error.message,
      });
    }
  }, [error, send]);

  const showLoading = !session || !challengeFrameReady;
  const showChallenge =
    session?.nextAction?.type === "challenge" && !failOnChallenge;

  return (
    <Overlay enabled={config.isOverlay} onCancel={handleCancel}>
      <div ref={container} style={size}>
        {showLoading && <ThreeDSecureLoading session={config.session} />}

        {showChallenge && (
          <ChallengeFrame
            nextAction={session.nextAction as ChallengeNextAction}
            onLoad={handleChallengeFrameLoad}
          />
        )}
      </div>
    </Overlay>
  );
}
