import { PropsWithChildren } from "react";

export interface ThreeDSecureCallbacks {
  /**
   * The error event will be fired if the component fails to load.
   */
  onError?(error: Error): void;

  /**
   * The 'requestChallenge' event will be fired if the 3DS authentication process requires a challenge.
   * If you'd like to fail the authentication, you should call `preventDefault` on the passed event.
   */
  onRequestChallenge?(event: Event): void;

  /**
   * The 'failure' event will be fired if the 3DS authentication process fails. You should use this event to handle the failure and inform the user and prompt them to try again.
   * If the user cancels the 3DS authentication process this event will be fired.
   */
  onFailure?(error: Error): void;

  /**
   * The 'success' event will be fired once the 3DS authentication process has been completed successfully.
   * You should use this event to trigger your backend to finalize the payment.
   * Your backend can use the [Retrieve 3DS Session](https://docs.evervault.com/api-reference#retrieveThreeDSSession) endpoint to retrieve the cryptogram for the session and complete the payment.
   */
  onSuccess?(): void;
}

export interface ThreeDSecureOptions extends ThreeDSecureCallbacks {
  /**
   * If set to `true` (or a function that returns `true`), the authentication will fail if a challenge is required.
   */
  failOnChallenge?: boolean | (() => Promise<boolean>);
}

export interface ThreeDSecureInitialState {
  session: ThreeDSecureSession | null;
  isVisible: boolean;
}

export interface ThreeDSecureSession {
  cancel(): Promise<void>;
  get(): Promise<ThreeDSecureSessionResponse>;
  sessionId: string;
}

export type SessionStatus = "action-required" | "failure" | "success";

export interface ThreeDSecureSessionResponse {
  nextAction: {
    creq?: string;
    type: string;
    url?: string;
  };
  status: SessionStatus;
}

export interface ThreeDSecureSessionsParams {
  appId: string;
  options?: ThreeDSecureOptions;
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  sessionId: string;
  setIsVisible: (show: boolean) => void;
}

export interface ThreeDSecureState extends ThreeDSecureInitialState {
  /**
   * The `cancel()` function is used to cancel the ongoing 3DS authentication process.
   * This can be particularly useful for canceling a session when a custom cancel button is triggered.
   */
  cancel(): Promise<void>;

  /**
   * The `start()` function is used to kick off the 3DS authentication process.
   *
   * @param sessionId The 3DS session ID. A 3DS session can be created using the [Evervault API](https://docs.evervault.com/api-reference#createThreeDSSession).
   * @param options The options to be used for the 3DS authentication process.
   */
  start(sessionId: string, options?: ThreeDSecureOptions): void;
}
