import { ReactNode, createContext, useContext, useEffect } from "react";
import * as React from "react";
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
  appId: string;
  teamId: string;
  children: ReactNode;
}

/**
 * @example
 * ```tsx
 * function App() {
 *  return (
 *    <EvervaultProvider teamId="team_123" appId="app_123">
 *      <Card onChange={(card) => console.log(card)}>
 *        <Card.Number />
 *      </Card>
 *    </EvervaultProvider>
 *  );
 * }
 * ```
 */
const EvervaultProvider = ({ teamId, appId, children }: EvervaultProps) => {
  useEffect(() => {
    async function initEvervault() {
      try {
        if (!teamId || !appId) {
          return;
        }

        return EvervaultSdk.initialize(teamId, appId);
      } catch (error) {
        throw new Error(`Failed to initialize the Evervault SDK ${error}`);
      }
    }

    if (teamId || appId) {
      initEvervault();
    }
  }, [teamId, appId]);

  return (
    <Ctx.Provider value={{ teamUuid: teamId, appUuid: appId }}>
      {children}
    </Ctx.Provider>
  );
};

export default EvervaultProvider;
