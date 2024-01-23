import * as React from "react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useEvervault } from "../useEvervault";
import { RevealClass, RevealContext } from "./RevealContext";
import { RevealCopyButton } from "./RevealCopyButton";
import { RevealText } from "./RevealText";

export interface RevealProps {
  request: Request;
  children: ReactNode | ReactNode[];
  onReady?: () => void;
  onError?: () => void;
}

function Reveal({ request, children, onReady, onError }: RevealProps) {
  const initialized = useRef(false);
  const ev = useEvervault();
  const [instance, setInstance] = useState<RevealClass | null>(null);
  const ref = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!ref.current || initialized.current) return;

    async function init() {
      initialized.current = true;
      const evervault = await ev;
      if (!evervault) return;
      const reveal = evervault.ui.reveal(request);
      setInstance(reveal);
    }

    init().catch(console.error);
  }, [instance, request, ev]);

  return (
    <RevealContext.Provider value={{ reveal: instance }}>
      <>
        <div ref={ref} />
        {children}
      </>
    </RevealContext.Provider>
  );
}

Reveal.Text = RevealText;
Reveal.CopyButton = RevealCopyButton;

export { Reveal };
