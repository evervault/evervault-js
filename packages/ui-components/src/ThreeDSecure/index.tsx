import { useEffect, useState } from "react";
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

export function ThreeDSecure({ config }: { config: ThreeDSecureConfig }) {
  const { send } = useThreeDSMessaging();
  const [challengeFrameReady, setChallengeFrameReady] = useState(false);
  const { session, refetch } = useSession(config.session);
  const size = config.size ?? { width: 500, height: 600 };

  const handleTimeout = () => {
    void refetch({ browserFingerprint: "timeout" });
  };

  const handleFingerprintComplete = () => {
    void refetch({ browserFingerprint: "complete" });
  };

  const handleCancel = () => {
    void refetch({ challengeCancelled: true });
    send("EV_CANCEL");
  };

  useEffect(() => {
    if (session?.status === "complete") {
      send("EV_SUCCESS");
    }
  }, [session]);

  return (
    <Overlay enabled={config.isOverlay} onCancel={handleCancel}>
      <div style={size}>
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

        {isChallengeAction(session?.nextAction) && (
          <ChallengeFrame
            nextAction={session.nextAction}
            onLoad={() => setChallengeFrameReady(true)}
          />
        )}
      </div>
    </Overlay>
  );
}
