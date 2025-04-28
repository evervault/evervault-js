import Encryption from "@repo/encryption";
import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { useSearchParams } from "../utilities/useSearchParams";

const Context = createContext<Encryption | null>(null);

export default function EncryptionProvider({ children }: PropsWithChildren) {
  const { team, app } = useSearchParams();

  // Throw an error if team or app are missing
  if (!team || !app) {
    throw new Error("Missing team, app or component");
  }

  const encryption = useMemo(() => {
    return new Encryption(team, app);
  }, [team, app]);

  return <Context.Provider value={encryption}>{children}</Context.Provider>;
}

export function useEncryption() {
  const ctx = useContext(Context);

  if (!ctx) {
    throw new Error("useEncryption must be used within a EncryptionProvider");
  }

  return ctx;
}
