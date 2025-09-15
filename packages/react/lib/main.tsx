import type {
  EvervaultRequestProps,
  InputSettings,
  RevealSettings,
} from "@evervault/browser";
import * as React from "react";
import * as themes from "themes";
import { EvervaultContext } from "./context";
import { useEvervault } from "./useEvervault";
import { CustomConfig, useEvervaultClient } from "./load";

export type * from "types";
export { Reveal } from "./ui/Reveal";
export { Card, type CardRef } from "./ui/Card";
export { Pin } from "./ui/Pin";
export { ThreeDSecure } from "./ui/ThreeDSecure";
export { useThreeDSecure } from "./ui/useThreeDSecure";
export { useEvervault, themes };

export type { PromisifiedEvervaultClient } from "./load";

export interface EvervaultProvider {
  /** Attempts to reload the Evervault script. */
  reload(): void;
}

export interface EvervaultProviderProps {
  teamId: string;
  appId: string;
  customConfig?: CustomConfig;
  children: React.ReactNode | null;
  /**
   * Callback function to be called when the Evervault script fails to load.
   */
  onLoadError?: () => void;
}

export const EvervaultProvider = React.forwardRef<
  EvervaultProvider,
  EvervaultProviderProps
>(({ teamId, appId, customConfig, children, onLoadError, ...props }, ref) => {
  const { client, reload } = useEvervaultClient({
    teamId,
    appId,
    customConfig,
    onLoadError,
  });

  React.useImperativeHandle(ref, () => ({
    reload,
  }));

  return (
    <EvervaultContext.Provider {...props} value={client}>
      {children}
    </EvervaultContext.Provider>
  );
});

export interface EvervaultInputProps {
  onChange?: (cardData: unknown) => void;
  config?: InputSettings;
  onInputsLoad?: () => void;
}

export function EvervaultInput({
  onChange,
  config,
  onInputsLoad,
}: EvervaultInputProps) {
  const id = React.useId();

  if (typeof window === "undefined") {
    return <div id={id} />;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const evervault = useEvervault();

  const { height = "auto", ...cfg } = config ?? {};
  const conf: InputSettings = !cfg ? { height } : { height, ...cfg };

  // eslint-disable-next-line react-hooks/rules-of-hooks
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

export interface EvervaultRevealProps {
  request: Request | EvervaultRequestProps;
  config?: RevealSettings;
  onCopy?: () => void;
  onRevealLoad?: () => void;
  onRevealError?: (e: unknown) => void;
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

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const evervault = useEvervault();

  const { height = "auto", ...cfg } = config ?? {};
  const conf: RevealSettings = !cfg ? { height } : { height, ...cfg };

  // eslint-disable-next-line react-hooks/rules-of-hooks
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
