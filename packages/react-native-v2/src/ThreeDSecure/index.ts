import { ThreeDSecure as ThreeDSecureRoot } from "./Root";
import { ThreeDSecureFrame } from "./Frame";

export const ThreeDSecure = Object.assign(ThreeDSecureRoot, {
  Frame: ThreeDSecureFrame,
});

export type { ThreeDSecureProps } from "./Root";
export type { ThreeDSecureFrameProps } from "./Frame";

export type {
  ThreeDSecureState,
  ThreeDSecureSession,
  ThreeDSecureCallbacks,
} from "./types";

export { useThreeDSecure } from "./useThreeDSecure";
