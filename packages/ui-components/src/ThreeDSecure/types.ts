import type { ThemeObject } from "types";

export interface NextAction {
  url: string;
  creq: string;
}

export interface ThreeDSecureConfig {
  theme?: ThemeObject;
  isOverlay: boolean;
  session: string;
  size?: { width: number; height: number };
}

export type TrampolineMessage = MessageEvent<{
  event: "ev-3ds-trampoline";
  cres: string | null;
}>;
