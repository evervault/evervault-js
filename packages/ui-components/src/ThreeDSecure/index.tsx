import { ReactNode, useState } from "react";
import { ChallengeFrame } from "./ChallengeFrame";
import { ThreeDSecureLoading } from "./Loading";
import { ThreeDSecureConfig } from "./types";
import { useNextAction } from "./utilities";

export function ThreeDSecure({ config }: { config: ThreeDSecureConfig }) {
  const [loading, setLoading] = useState(true);
  const nextAction = useNextAction(config.session);
  const size = config.size ?? { width: 500, height: 600 };

  return (
    <Overlay enabled={config.isOverlay}>
      <div style={size}>
        {loading && <ThreeDSecureLoading session={config.session} />}
        {nextAction && (
          <ChallengeFrame
            nextAction={nextAction}
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
