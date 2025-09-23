import type { ThemeObject } from "types";
import { ChallengeNextAction } from "../ThreeDSecure/types";

export interface ThreeDSecureWithProfilingConfig {
  theme?: ThemeObject;
  isOverlay: boolean;
  session: string;
  size?: { width: number; height: number };
  failOnChallenge?: boolean;
}

export interface ProfiledSessionData {
  status: "action-required" | "success" | "failure";
  nextAction?: ChallengeNextAction;
}
