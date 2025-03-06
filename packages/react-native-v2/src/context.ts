import { createContext } from "react";

export interface EvervaultContextValue {
  teamId: string;
  appId: string;
  initialized: boolean;
}

export const EvervaultContext = createContext<EvervaultContextValue | null>(
  null
);
