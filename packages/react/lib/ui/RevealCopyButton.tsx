import type Evervault from "@evervault/browser";
import * as React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { useRevealContext } from "./RevealContext";

interface RevealCopyButtonProps {
  path: string;
  onCopy?: () => void;
}

type RevealInstance = ReturnType<Evervault["ui"]["reveal"]>;
type RevealCopyButtonClass = ReturnType<RevealInstance["copyButton"]>;

export function RevealCopyButton({
  path,
  onCopy,
  ...options
}: RevealCopyButtonProps) {
  const [instance, setInstance] = useState<RevealCopyButtonClass | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { reveal } = useRevealContext();

  // setup ready event listener
  React.useEffect(() => {
    if (!reveal) return undefined;
    if (!onCopy) return undefined;
    return instance?.on("copy", onCopy);
  }, [instance, reveal, onCopy]);

  useLayoutEffect(() => {
    if (!ref.current) return;
    if (instance) return;
    if (!reveal) return;
    const inst = reveal.copyButton(path, options);
    inst.mount(ref.current);
    setInstance(inst);
  }, [reveal, path, options, instance]);

  return <div ref={ref} />;
}
