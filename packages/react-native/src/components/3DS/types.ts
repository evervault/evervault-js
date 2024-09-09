import { TextStyle, ViewStyle } from "react-native";

export interface ThreeDSecureCallbacks {
  onError: (error: Error) => void;
  onFailure: (error: Error) => void;
  onSuccess: () => void;
}

export interface ThreeDSecureInitialState {
  session: ThreeDSecureSession | null;
  isVisible: boolean;
}

export interface ThreeDSecureModalConfig {
  closeButtonText: string;
  titleText: string;
}

export interface ThreeDSecureModalProps {
  config?: ThreeDSecureModalConfig;
  style?: ThreeDSecureModalStyle;
}

export interface ThreeDSecureModalStyle {
  closeButtonStyle: object;
  closeButtonTextStyle: TextStyle;
  modalContentStyle: ViewStyle;
  modalStyle: ViewStyle;
  titleBarStyle: ViewStyle;
  titleTextStyle: TextStyle;
}

export interface ThreeDSecureProviderProps {
  children: React.ReactNode;
  state: ThreeDSecureState;
}

export interface ThreeDSecureSession {
  cancel: () => Promise<void>;
  get: () => Promise<ThreeDSecureSessionResponse>;
  sessionId: string;
}

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
  callbacks: ThreeDSecureCallbacks;
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  sessionId: string;
  setIsVisible: (show: boolean) => void;
}

export interface ThreeDSecureState extends ThreeDSecureInitialState {
  cancel: () => Promise<void>;
  start: (sessionId: string, callbacks: ThreeDSecureCallbacks) => void;
}

type SessionStatus = "action-required" | "failure" | "success";