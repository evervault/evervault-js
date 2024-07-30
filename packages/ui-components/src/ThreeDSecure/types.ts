import type { ThemeObject } from "types";

export interface IssuerFingerprintNextAction {
  type: "issuer-fingerprint";
  url: string;
  data: string;
}

export interface ChallengeNextAction {
  type: "challenge";
  url: string;
  creq: string;
}

export type NextAction = IssuerFingerprintNextAction | ChallengeNextAction;

export interface SessionData {
  status: "action-required" | "complete";
  next_action: NextAction;
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
