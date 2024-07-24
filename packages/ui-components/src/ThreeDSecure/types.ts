import type { ThemeObject } from "types";

export interface ThreeDSecureConfig {
  theme?: ThemeObject;
  isOverlay: boolean;
  session: string;
  size?: { width: number; height: number };
}
