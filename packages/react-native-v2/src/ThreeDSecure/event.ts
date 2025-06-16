import { ThreeDSecureSession } from "./types";

export type ThreeDSecureEventType = "requestChallenge";

export class ThreeDSecureEvent {
  constructor(
    public readonly type: ThreeDSecureEventType,
    public readonly session: ThreeDSecureSession,
    private _defaultPrevented: boolean = false
  ) {}

  public preventDefault() {
    this._defaultPrevented = true;
  }

  public get defaultPrevented() {
    return this._defaultPrevented;
  }
}
