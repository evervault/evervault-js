import { ReactNode, createContext, useContext, useEffect } from "react";
import * as React from "react";
import { init } from "../sdk";
import { EvervaultSdk } from "../native";

export interface EvervaultContext {
  teamUuid?: string;
  appUuid?: string;
}

const Ctx = createContext<EvervaultContext>({
  teamUuid: undefined,
  appUuid: undefined,
});

// this isn't publicly exposed
export const useEvervault = () => useContext(Ctx);

interface EvervaultProps {
  appUuid: string;
  teamUuid: string;
  children: ReactNode;
}

const EvervaultProvider = ({ teamUuid, appUuid, children }: EvervaultProps) => {
  useEffect(() => {
    async function initEvervault() {
      try {
        if (!teamUuid?.startsWith("team_")) {
          throw new Error("Invalid Evervault Team UUID");
        }

        if (!appUuid?.startsWith("app_")) {
          throw new Error("Invalid Evervault App UUID");
        }

        return EvervaultSdk.initialize(teamUuid, appUuid);
      } catch (error) {
        throw new Error(`Failed to initialize the Evervault SDK ${error}`);
      }
    }

    if (teamUuid || appUuid) {
      initEvervault();
    }
  }, [teamUuid, appUuid]);

  return <Ctx.Provider value={{ teamUuid, appUuid }}>{children}</Ctx.Provider>;
};

export default EvervaultProvider;
