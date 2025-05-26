import * as React from "react";
import { EvervaultContext } from "./context";
import type { PromisifiedEvervaultClient } from "./load";

export function useEvervault(): PromisifiedEvervaultClient | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (typeof React.useContext !== "function") {
    throw new Error(
      "You must use React >= 18.0 in order to use useEvervault()"
    );
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const evervault = React.useContext(EvervaultContext);
  if (!evervault) {
    throw new Error(
      "You must wrap your app in an <EvervaultProvider> to use useEvervault()"
    );
  }

  return evervault;
}
