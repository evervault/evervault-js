import { TextStyle, ViewStyle } from "react-native";

/* ---------------------------------------------
   Types and Interfaces for 3DS Callbacks and Session Responses
------------------------------------------------- */

// Callbacks to handle the various outcomes of a 3DS session
export interface ThreeDSecureCallbacks {
  onSuccess: () => void;
  onFailure: (error: Error) => void;
  onError: (error: Error) => void;
}

// Possible statuses of a 3DS session
type SessionStatus = "action-required" | "success" | "failure";

// Response structure for a 3DS session
export interface ThreeDSecureSessionResponse {
  nextAction: {
    type: string;
    url?: string;
    creq?: string;
  };
  status: SessionStatus;
}

/* ---------------------------------------------
   Types and Interfaces for 3DS Modal Configuration and Styling
------------------------------------------------- */

// Configuration options for the 3DS modal
export interface ThreeDSecureModalConfig {
  titleText: string;
  closeButtonText: string;
}

// Styling options for the 3DS modal and its components
export interface ThreeDSecureModalStyle {
  modalStyle: ViewStyle;
  modalContentStyle: ViewStyle;
  titleBarStyle: ViewStyle;
  titleTextStyle: TextStyle;
  closeButtonStyle: object;
  closeButtonTextStyle: TextStyle;
}

/* ---------------------------------------------
   Types and Interfaces for 3DS Secure Session and Modal Props
------------------------------------------------- */

// Props for the 3DS modal component
export interface ThreeDSecureModalProps {
  state: UseThreeDSecureState;
  config?: ThreeDSecureModalConfig;
  style?: ThreeDSecureModalStyle;
}

export interface UseThreeDSecureState {
  session: ThreeDSecureSession | null;
  displayModal: boolean;
}

export interface UseThreeDSecureResponse extends UseThreeDSecureState {
  start: (sessionId: string, callbacks: ThreeDSecureCallbacks) => void;
  cancel: () => Promise<void>;
}

// Parameters needed to start a 3DS session
export interface ThreeDSecureSessionsParams {
  sessionId: string;
  appId: string;
  callbacks: ThreeDSecureCallbacks;
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  setDisplayModal: (show: boolean) => void;
}


/* ---------------------------------------------
   Types and Interfaces for 3DS Provider Component Props
------------------------------------------------- */
export interface ThreeDSecureProviderProps {
    state: UseThreeDSecureResponse;
    children: React.ReactNode;
  }

/* ---------------------------------------------
   Types and Interfaces for 3DS Session Management
------------------------------------------------- */

// Interface representing the 3DS session object
export interface ThreeDSecureSession {
  get: () => Promise<ThreeDSecureSessionResponse>;
  cancel: () => Promise<void>;
  sessionId: string;
}