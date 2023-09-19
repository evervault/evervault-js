import * as React from "react";
import type EvervaultClient from "@evervault/browser";
import type { EvervaultRequestProps } from "@evervault/browser";

export interface EvervaultProviderProps {
  teamId: string;
  appId: string;
  customConfig?: any;
  children: React.ReactNode | null;
}

export interface EvervaultInputProps {
  onChange?: (cardData: any) => void;
  config?: any;
  onInputsLoad?: () => void;
}

export interface EvervaultRevealProps {
  request: Request | EvervaultRequestProps;
  config?: any;
  onCopy?: () => void;
  onRevealLoad?: () => void;
  onRevealError?: (e: any) => void;
}

export class PromisifiedEvervaultClient extends Promise<EvervaultClient> {
  constructor(...args: ConstructorParameters<typeof Promise<EvervaultClient>>) {
    super(...args);
  }

  public encrypt(data: any): Promise<string> {
    return this.then((ev) => ev.encrypt(data));
  }
}

export const EvervaultContext =
  React.createContext<PromisifiedEvervaultClient | null>(null);

const EVERVAULT_URL = "https://js.evervault.com/v2";
const injectScript = (overrideUrl?: string) => {
  const script = document.createElement("script");

  if (overrideUrl) {
    script.src = overrideUrl;
  } else {
    script.src = EVERVAULT_URL;
  }

  const headOrBody = document.head || document.body;

  if (!headOrBody) {
    throw new Error(
      "Expected document.body not to be null. Evervault.js requires a <body> element."
    );
  }

  headOrBody.appendChild(script);

  return script;
};

let evervaultPromise: Promise<unknown> | null = null;

const loadScript = (overrideUrl?: string) => {
  // Ensure that we only attempt to load Evervault.js at most once
  if (evervaultPromise !== null) {
    return evervaultPromise;
  }

  evervaultPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }

    if (window.Evervault) {
      console.warn("Evervault has already been loaded");
      resolve(window.Evervault);
      return;
    }

    try {
      const script = injectScript(overrideUrl);

      script.addEventListener("load", () => {
        if (window.Evervault) {
          resolve(window.Evervault);
        } else {
          reject(new Error("Evervault.js not available"));
        }
      });

      script.addEventListener("error", () => {
        reject(new Error("Failed to load Evervault.js"));
      });
    } catch (error) {
      reject(error);
      return;
    }
  });

  return evervaultPromise;
};

const loadEvervault = async (
  overrideUrl?: string
): Promise<typeof EvervaultClient | undefined> => {
  const evervaultPromise = Promise.resolve().then(() =>
    loadScript(overrideUrl)
  );

  let loadCalled = false;

  evervaultPromise.catch((err) => {
    if (!loadCalled) {
      console.warn(err);
    }
  });

  loadCalled = true;
  return evervaultPromise.then(() => {
    if (typeof window !== "undefined") return window.Evervault;
  });
};

export const EvervaultProvider = ({
  teamId,
  appId,
  customConfig,
  children,
  ...props
}: EvervaultProviderProps) => {
  if (typeof window === "undefined") {
    return (
      <EvervaultContext.Provider value={null}>
        {children}
      </EvervaultContext.Provider>
    );
  }

  const ev = React.useMemo<PromisifiedEvervaultClient>(
    () =>
      new PromisifiedEvervaultClient((resolve, reject) => {
        loadEvervault(customConfig?.jsSdkUrl).then((evervault) => {
          if (evervault !== undefined) {
            resolve(new evervault(teamId, appId, customConfig));
          } else {
            console.error("Evervault.js not available");
            reject("Evervault.js not available");
          }
        });
      }),
    []
  );

  return (
    <EvervaultContext.Provider {...props} value={ev}>
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

  React.useEffect(() => {
    evervault?.then((ev) => {
      const encryptedInput = ev.inputs(id, cfg);
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
    });
  }, [evervault]);

  return <div id={id} />;
};

export const EvervaultReveal = ({
  request,
  config,
  onCopy,
  onRevealLoad,
  onRevealError,
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

  React.useEffect(() => {
    evervault?.then((ev) => {
      const encryptedInput = ev.reveal(id, request, cfg, onCopy);

      if (
        encryptedInput?.isRevealLoaded != null &&
        encryptedInput.isRevealLoaded instanceof Promise
      ) {
        encryptedInput.isRevealLoaded
          .then(() => {
            if (onRevealLoad) {
              onRevealLoad();
            }
          })
          .catch((e) => {
            if (onRevealError) {
              onRevealError(e);
            }
          });
      }
    });
  }, [evervault]);

  return <div id={id} />;
};

export function useEvervault(): PromisifiedEvervaultClient | null {
  if (typeof window === "undefined") {
    return null;
  }

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
