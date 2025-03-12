import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { type EvervaultContextValue, EvervaultContext } from "./context";
import { sdk } from "./sdk";

export interface EvervaultProviderProps extends PropsWithChildren {
  teamId: string;
  appId: string;
}

export function EvervaultProvider({
  teamId,
  appId,
  children,
}: EvervaultProviderProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    sdk.initialize(teamId, appId);
    setReady(true);
  }, [teamId, appId]);

  const context = useMemo<EvervaultContextValue>(
    () => ({ teamId, appId, ready }),
    [teamId, appId, ready]
  );

  return (
    <EvervaultContext.Provider value={context}>
      {children}
    </EvervaultContext.Provider>
  );
}
