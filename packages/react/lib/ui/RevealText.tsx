import type Evervault from "@evervault/browser";
import * as React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { useRevealContext } from "./RevealContext";
import type { ColorScheme, RevealFormat, ThemeDefinition } from "types";

interface RevealTextProps {
  path: string;
  theme?: ThemeDefinition;
  colorScheme?: ColorScheme;
  format?: RevealFormat;
}

type RevealInstance = ReturnType<Evervault["ui"]["reveal"]>;
type RevealTextClass = ReturnType<RevealInstance["text"]>;

export function RevealText({
  path,
  theme,
  format,
  colorScheme,
}: RevealTextProps) {
  const [instance, setInstance] = useState<RevealTextClass | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { reveal } = useRevealContext();

  useLayoutEffect(() => {
    if (!ref.current) return;
    if (instance) return;
    if (!reveal) return;

    const inst = reveal.text(path, { colorScheme, theme, format });
    inst.mount(ref.current);
    setInstance(inst);
  }, [reveal, path, colorScheme, theme, format, instance]);

  return <div ref={ref} />;
}
