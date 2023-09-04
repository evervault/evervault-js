import * as React from "react";
import type EvervaultClient from "@evervault/browser";

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

const EVERVAULT_URL = 'https://js.evervault.com/v2';
const injectScript = () => {
  const script = document.createElement('script');
  script.src = EVERVAULT_URL;

  const headOrBody = document.head || document.body;

  if (!headOrBody) {
    throw new Error(
      'Expected document.body not to be null. Evervault.js requires a <body> element.'
    );
  }

  headOrBody.appendChild(script);

  return script;
};

let evervaultPromise: Promise<unknown> | null = null;

const loadScript = () => {
  // Ensure that we only attempt to load Evervault.js at most once
  if (evervaultPromise !== null) {
    return evervaultPromise;
  }

  evervaultPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    if (window.Evervault) {
      console.warn('Evervault has already been loaded');
    }

    if (window.Evervault) {
      resolve(window.Evervault);
      return;
    }

    try {
      const script = injectScript();

      script.addEventListener('load', () => {
        if (window.Evervault) {
          resolve(window.Evervault);
        } else {
          reject(new Error('Evervault.js not available'));
        }
      });

      script.addEventListener('error', () => {
        reject(new Error('Failed to load Evervault.js'));
      });
    } catch (error) {
      reject(error);
      return;
    }
  });

  return evervaultPromise;
};

const loadEvervault = async (): Promise<typeof EvervaultClient | undefined> => {
  const evervaultPromise = Promise.resolve().then(() => loadScript());

  let loadCalled = false;

  evervaultPromise.catch((err) => {
    if (!loadCalled) {
      console.warn(err);
    }
  });

  loadCalled = true;
  return evervaultPromise.then(() => {
    if (typeof window !== 'undefined') return window.Evervault;
  });
};

export const EvervaultProvider = ({
  teamId,
  appId,
  customConfig,
  children,
  ...props
}: EvervaultProviderProps) => {
  if (typeof window === 'undefined') {
    return (
      <EvervaultContext.Provider value={null}>
        {children}
      </EvervaultContext.Provider>
    );
  }

  const [ev, setEv] = React.useState<EvervaultClient | null>(null);

  React.useEffect(() => {
    loadEvervault().then((evervault) => {
      if (evervault !== undefined) {
        setEv(new evervault(teamId, appId, customConfig))
      }
    });
  }, [loadEvervault]);

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
  if (typeof window === 'undefined') {
    return;
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
