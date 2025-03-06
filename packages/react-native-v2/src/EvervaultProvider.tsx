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
  const [initialized, setInitialized] = useState(false);

  const context = useMemo<EvervaultContextValue>(
    () => ({ teamId, appId, initialized }),
    [teamId, appId, initialized]
  );

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    async function initialize() {
      setInitialized(false);
      try {
        await sdk.initialize(teamId, appId, { signal });
        setInitialized(true);
      } catch (error) {
        console.error(error);
      }
    }

    initialize();
    return abortController.abort;
  }, [teamId, appId]);

  return (
    <EvervaultContext.Provider value={context}>
      {children}
    </EvervaultContext.Provider>
  );
}
