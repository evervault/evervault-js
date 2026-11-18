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

/** The browser fields the 3DS server needs for a browser-based authentication. */
export interface BrowserDetails {
  javaEnabled: boolean;
  javascriptEnabled: boolean;
  language: string;
  colorDepth: number;
  screenHeight: number;
  screenWidth: number;
  /** Minutes from local time to UTC, from `Date.getTimezoneOffset()`. */
  timeZone: number;
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
