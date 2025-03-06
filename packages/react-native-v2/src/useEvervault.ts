import { useContext } from "react";
import { EvervaultContext } from "./context";

export function useEvervault() {
  const context = useContext(EvervaultContext);

  if (!context) {
    throw new Error(
      "`useEvervault` must be used within an `EvervaultProvider`."
    );
  }

  return context;
}
