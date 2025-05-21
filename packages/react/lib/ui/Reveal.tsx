import * as React from "react";
import { ReactNode } from "react";
import { RevealContext } from "./RevealContext";
import { RevealCopyButton } from "./RevealCopyButton";
import { RevealText } from "./RevealText";
import { useEvInstance } from "../useEvInstance";

export interface RevealProps {
  request: Request;
  children: ReactNode | ReactNode[];
  onReady?: () => void;
  onError?: () => void;
}

function Reveal({ request, children, onReady, onError }: RevealProps) {
  const instance = useEvInstance({
    onMount(evervault) {
      return evervault.ui.reveal(request);
    },
  });
  const context = React.useMemo(() => ({ reveal: instance }), [instance]);

  // setup ready event listener
  React.useEffect(() => {
    if (!instance || !onReady) return undefined;
    return instance?.on("ready", onReady);
  }, [instance, onReady]);

  // setup error event listener
  React.useEffect(() => {
    if (!instance || !onError) return undefined;
    return instance?.on("error", onError);
  }, [instance, onError]);

  return (
    <RevealContext.Provider value={context}>{children}</RevealContext.Provider>
  );
}

Reveal.Text = RevealText;
Reveal.CopyButton = RevealCopyButton;

export { Reveal };
