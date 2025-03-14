import { ThreeDSecureState } from "./types";
import { useEvervault } from "../useEvervault";
import { ThreeDSecureContext } from "./context";
import { PropsWithChildren } from "react";

export interface ThreeDSecureProps extends PropsWithChildren {
  /**
   * The 3DS session state returned from the `useThreeDSecure` hook.
   */
  state: ThreeDSecureState;
}

export function ThreeDSecure({ state, children }: ThreeDSecureProps) {
  useEvervault();

  if (!state.session) return null;

  return (
    <ThreeDSecureContext.Provider value={state}>
      {state.isVisible && children}
    </ThreeDSecureContext.Provider>
  );
}
