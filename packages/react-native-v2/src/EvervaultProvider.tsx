import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { type EvervaultContextValue, EvervaultContext } from "./context";
import { Encrypted, sdk } from "./sdk";

export interface EvervaultProviderProps extends PropsWithChildren {
  teamId: string;
  appId: string;
}

export function EvervaultProvider({
  teamId,
  appId,
  children,
}: EvervaultProviderProps) {
  const instanceId = useMemo(
    () => sdk.initialize(teamId, appId),
    [teamId, appId]
  );

  const encrypt = useCallback(
    function <T>(data: T): Promise<Encrypted<T>> {
      return sdk.encrypt(instanceId, data);
    },
    [instanceId]
  );

  const context = useMemo<EvervaultContextValue>(
    () => ({ teamId, appId, encrypt }),
    [teamId, appId, encrypt]
  );

  return (
    <EvervaultContext.Provider value={context}>
      {children}
    </EvervaultContext.Provider>
  );
}
