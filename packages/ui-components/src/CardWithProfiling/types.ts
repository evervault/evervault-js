export interface ProfilingSession {
  sessionId: string;
  nextAction: {
    type: "browser-fingerprint";
    url: string;
    data: string;
  };
}

export interface BrowserInfo {
  javaEnabled: boolean;
  javaScriptEnabled: boolean;
  language: string;
  colorDepth: number;
  screenHeight: number;
  screenWidth: number;
  timeZone: number;
}

export interface ProfilingSessionCreateRequest {
  cardBin: string;
  browser: BrowserInfo;
  frame: {
    width: number;
    height: number;
  };
}

export interface UseEarlyProfilingOptions {
  enabled: boolean;
  onComplete?: (sessionId: string) => void;
  onError?: (error: Error) => void;
}

export interface UseEarlyProfilingReturn {
  shouldStartProfiling: (cardNumber: string) => boolean;
  startProfiling: (cardNumber: string) => Promise<void>;
  profilingSession: ProfilingSession | null;
  profilingError: Error | null;
  isProfilingActive: boolean;
}