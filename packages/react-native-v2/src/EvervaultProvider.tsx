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
    const abortController = new AbortController();
    const signal = abortController.signal;

    async function initialize() {
      setReady(false);
      try {
        await sdk.initialize(teamId, appId, { signal });
        setReady(true);
      } catch (error) {
        console.error(error);
      }
    }

    initialize();
    return () => abortController.abort();
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
