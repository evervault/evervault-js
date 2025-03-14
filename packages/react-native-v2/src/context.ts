import { createContext } from "react";
import type { Encrypted } from "./sdk";

export type EncryptFn = <T>(data: T) => Promise<Encrypted<T>>;

export interface EvervaultContextValue {
  teamId: string;
  appId: string;
  encrypt: EncryptFn;
}

export const EvervaultContext = createContext<EvervaultContextValue | null>(
  null
);
