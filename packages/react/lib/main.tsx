import * as React from "react";
import EvervaultClient from "@evervault/browser";

export type EvervaultProviderProps = {
  teamId: string;
  appId: string;
  customConfig?: any;
  children: React.ReactNode | null;
};

export type EvervaultInputProps = {
  onChange?: (cardData: any) => void;
  config?: any;
  onInputsLoad?: () => void;
};

export type EvervaultRevealProps = {
  request: Request;
  config?: any;
  onRevealLoad?: () => void;
};

export const EvervaultContext = React.createContext<EvervaultClient | null>(
  null
);

export const EvervaultProvider = ({
  teamId,
  appId,
  customConfig,
  children,
}: EvervaultProviderProps) => {
  const evervault = React.useMemo(() => {
    return new EvervaultClient(teamId, appId, customConfig);
  }, [teamId, appId, customConfig]);

  return (
    <EvervaultContext.Provider value={evervault}>
      {children}
    </EvervaultContext.Provider>
  );
};

export const EvervaultInput = ({
  onChange,
  config,
  onInputsLoad,
}: EvervaultInputProps) => {
  const id = React.useId();

  if (typeof window === "undefined") {
    return <div id={id} />;
  }

  const evervault = useEvervault();

  let cfg = config;
  if (!cfg) {
    cfg = {
      height: "auto",
    };
  } else if (!cfg.height) {
    cfg = {
      height: "auto",
      ...cfg,
    };
  }

  const initEvForm = async () => {
    const encryptedInput = evervault?.inputs(id, cfg);
    encryptedInput?.on("change", async (cardData: any) => {
      if (typeof onChange === "function") {
        onChange(cardData);
      }
    });

    if (
      onInputsLoad &&
      encryptedInput?.isInputsLoaded != null &&
      encryptedInput.isInputsLoaded instanceof Promise
    ) {
      encryptedInput.isInputsLoaded.then(() => onInputsLoad());
    }
  };

  React.useEffect(() => {
    initEvForm();
  }, [evervault]);

  return <div id={id} />;
};

export const EvervaultReveal = ({
  request,
  config,
  onRevealLoad,
}: EvervaultRevealProps) => {
  const id = React.useId();

  if (typeof window === "undefined") {
    return <div id={id} />;
  }

  const evervault = useEvervault();

  let cfg = config;
  if (!cfg) {
    cfg = {
      height: "auto",
    };
  } else if (!cfg.height) {
    cfg = {
      height: "auto",
      ...cfg,
    };
  }

  const initEvForm = async () => {
    const encryptedInput = evervault?.reveal(id, request, cfg);

    if (
      onRevealLoad &&
      encryptedInput?.isRevealLoaded != null &&
      encryptedInput.isRevealLoaded instanceof Promise
    ) {
      encryptedInput.isRevealLoaded.then(() => onRevealLoad());
    }
  };

  React.useEffect(() => {
    initEvForm();
  }, [evervault]);

  return <div id={id} />;
};

export function useEvervault() {
  if (typeof React.useContext !== "function") {
    throw new Error(
      "You must use React >= 18.0 in order to use useEvervault()"
    );
  }
  const evervault = React.useContext(EvervaultContext);
  if (!evervault) {
    throw new Error(
      "You must wrap your app in an <EvervaultProvider> to use useEvervault()"
    );
  }
  return evervault;
}
