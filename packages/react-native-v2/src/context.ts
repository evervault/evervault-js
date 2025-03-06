import { createContext } from "react";

export interface EvervaultContextValue {
  teamId: string;
  appId: string;
  ready: boolean;
}

export const EvervaultContext = createContext<EvervaultContextValue | null>(
  null
);
