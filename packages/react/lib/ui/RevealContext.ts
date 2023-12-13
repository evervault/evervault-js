import type Evervault from "@evervault/browser";
import { createContext, useContext } from "react";

export type RevealClass = ReturnType<Evervault["ui"]["reveal"]>;

export interface RevealContextType {
  reveal: RevealClass | null;
}

export const RevealContext = createContext<RevealContextType | undefined>(
  undefined
);

export function useRevealContext() {
  const context = useContext(RevealContext);

  if (!context) {
    throw new Error("Reveal consumers must be used within a Reveal component");
  }

  return context;
}
