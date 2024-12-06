import { createContext } from "react";
import { ThreeDSecureState } from "./types";

export const ThreeDSecureContext = createContext<ThreeDSecureState | null>(
  null
);
