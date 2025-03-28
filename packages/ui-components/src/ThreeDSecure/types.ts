import type { ThemeObject } from "types";

export interface BrowserFingerprintNextAction {
  type: "browser-fingerprint";
  url: string;
  data: string;
}

export interface ChallengeNextAction {
  type: "challenge";
  url: string;
  creq: string;
}

export type NextAction = BrowserFingerprintNextAction | ChallengeNextAction;

export interface SessionData {
  status: "action-required" | "success" | "failure";
  nextAction: NextAction;
}

export interface ThreeDSecureConfig {
  theme?: ThemeObject;
  isOverlay: boolean;
  session: string;
  size?: { width: number; height: number };
  failOnChallenge?: boolean;
}

export type TrampolineMessage = MessageEvent<{
  event: "ev-3ds-trampoline";
  cres: string | null;
}>;
