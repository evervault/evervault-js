import type EvervaultClient from "@evervault/browser";
import type {
  EvervaultRequestProps,
  CustomConfig as BrowserConfig,
  RevealSettings,
  InputSettings,
} from "@evervault/browser";
import * as React from "react";

export interface CustomConfig extends BrowserConfig {
  jsSdkUrl: string;
}

export interface EvervaultProviderProps {
  teamId: string;
  appId: string;
  customConfig?: CustomConfig;
  children: React.ReactNode | null;
}

export interface EvervaultInputProps {
  onChange?: (cardData: unknown) => void;
  config?: InputSettings;
  onInputsLoad?: () => void;
}

export interface EvervaultRevealProps {
  request: Request | EvervaultRequestProps;
  config?: RevealSettings;
  onCopy?: () => void;
  onRevealLoad?: () => void;
  onRevealError?: (e: unknown) => void;
}

export class PromisifiedEvervaultClient extends Promise<EvervaultClient> {
  public async encrypt(data: unknown) {
    const ev = await this;
    return ev.encrypt(data);
  }
}

export const EvervaultContext =
  React.createContext<PromisifiedEvervaultClient | null>(null);

const EVERVAULT_URL = "https://js.evervault.com/v2";
function injectScript(overrideUrl?: string) {
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
}

type EvervaultClientPromise = Promise<typeof EvervaultClient | undefined>;
let evervaultPromise: EvervaultClientPromise | null = null;

function loadScript(overrideUrl?: string): EvervaultClientPromise | null {
  // Ensure that we only attempt to load Evervault.js at most once
  if (evervaultPromise !== null) {
    return evervaultPromise;
  }

  evervaultPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve(undefined);
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
    }
  });

  return evervaultPromise;
}

function loadEvervault(overrideUrl?: string): EvervaultClientPromise {
  const evPromise = Promise.resolve().then(() => loadScript(overrideUrl));

  let loadCalled = false;

  evPromise.catch((err) => {
    if (!loadCalled) {
      console.warn(err);
    }
  });

  loadCalled = true;
  return evPromise.then((ev) => {
    if (typeof window !== "undefined") return window.Evervault;
    return ev ?? undefined;
  });
}

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
        void loadEvervault(customConfig?.jsSdkUrl).then((Evervault) => {
          if (Evervault !== undefined) {
            resolve(new Evervault(teamId, appId, customConfig));
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

export function EvervaultInput({
  onChange,
  config,
  onInputsLoad,
}: EvervaultInputProps) {
  const id = React.useId();

  if (typeof window === "undefined") {
    return <div id={id} />;
  }

  const evervault = useEvervault();

  const { height = "auto", ...cfg } = config ?? {};
  const conf: InputSettings = !cfg ? { height } : { height, ...cfg };

  React.useEffect(() => {
    void evervault?.then((ev) => {
      const encryptedInput = ev.inputs(id, conf);
      encryptedInput?.on("change", (cardData: unknown) => {
        if (typeof onChange === "function") {
          onChange(cardData);
        }
      });

      if (
        onInputsLoad &&
        encryptedInput?.isInputsLoaded != null &&
        encryptedInput.isInputsLoaded instanceof Promise
      ) {
        void encryptedInput.isInputsLoaded.then(() => onInputsLoad());
      }
    });
  }, [evervault]);

  return <div id={id} />;
}

export function EvervaultReveal({
  request,
  config,
  onCopy,
  onRevealLoad,
  onRevealError,
}: EvervaultRevealProps) {
  const id = React.useId();

  if (typeof window === "undefined") {
    return <div id={id} />;
  }

  const evervault = useEvervault();

  const { height = "auto", ...cfg } = config ?? {};
  const conf: RevealSettings = !cfg ? { height } : { height, ...cfg };

  React.useEffect(() => {
    void evervault?.then((ev) => {
      const encryptedInput = ev.reveal(id, request, conf, onCopy);

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
          .catch((e: Error) => {
            if (onRevealError) {
              onRevealError(e);
            }
          });
      }
    });
  }, [evervault]);

  return <div id={id} />;
}

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
