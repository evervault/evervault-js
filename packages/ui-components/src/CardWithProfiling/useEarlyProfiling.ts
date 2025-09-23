import { useCallback, useState, useRef } from "react";
import { useSearchParams } from "../utilities/useSearchParams";
import type {
  BrowserInfo,
  ProfilingSession,
  UseEarlyProfilingOptions,
  UseEarlyProfilingReturn,
} from "./types";

const API = import.meta.env.VITE_API_URL as string;

function getBrowserInfo(): BrowserInfo {
  return {
    javaEnabled: window.navigator.javaEnabled(),
    javaScriptEnabled: true,
    language: navigator.language,
    colorDepth: window.screen.colorDepth,
    screenHeight: window.screen.height,
    screenWidth: window.screen.width,
    timeZone: new Date().getTimezoneOffset(),
  };
}

async function createProfilingSession(
  appId: string,
  cardBin: string,
  browserInfo: BrowserInfo
): Promise<ProfilingSession> {
  const response = await fetch(`${API}/frontend/3ds/profiling`, {
    method: "POST",
    headers: {
      "X-Evervault-App-Id": appId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bin: cardBin,
      browser: browserInfo,
      frame: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("3DS profiling not supported for this card");
    }
    if (response.status === 400) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Invalid profiling request");
    }
    if (response.status === 429) {
      throw new Error("Too many profiling requests. Please try again later.");
    }
    
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Failed to create profiling session: ${errorText}`);
  }

  const data = await response.json();
  
  // Validate response structure
  if (!data.id || !data.nextAction) {
    throw new Error("Invalid profiling session response from server");
  }

  if (data.nextAction.type !== "browser-fingerprint") {
    throw new Error("Unexpected profiling action type received");
  }

  return {
    sessionId: data.id,
    nextAction: {
      type: "browser-fingerprint",
      url: data.nextAction.url,
      data: data.nextAction.data,
    },
  };
}

export function useEarlyProfiling(options: UseEarlyProfilingOptions): UseEarlyProfilingReturn {
  const { enabled, onError } = options;
  const { app } = useSearchParams();
  
  const [profilingSession, setProfilingSession] = useState<ProfilingSession | null>(null);
  const [profilingError, setProfilingError] = useState<Error | null>(null);
  const [isProfilingActive, setIsProfilingActive] = useState(false);
  
  const profiledBins = useRef<Set<string>>(new Set());
  const isInitiatingProfiling = useRef(false);

  const shouldStartProfiling = useCallback((cardNumber: string): boolean => {
    if (!enabled || !app) return false;
    
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    // Need at least 6 digits for BIN identification
    if (cleanNumber.length < 6) return false;
    
    const bin = cleanNumber.substring(0, 10);
    
    // Don't profile the same BIN twice
    if (profiledBins.current.has(bin)) return false;
    
    // Don't start if already profiling
    if (isProfilingActive || isInitiatingProfiling.current) return false;
    
    return true;
  }, [enabled, app, isProfilingActive]);

  const startProfiling = useCallback(async (cardNumber: string): Promise<void> => {
    if (!enabled || !app || isInitiatingProfiling.current) return;
    
    const cleanNumber = cardNumber.replace(/\D/g, '');
    const bin = cleanNumber.substring(0, 6);
    
    if (profiledBins.current.has(bin)) return;
    
    isInitiatingProfiling.current = true;
    setIsProfilingActive(true);
    setProfilingError(null);
    
    try {
      const browserInfo = getBrowserInfo();
      const session = await createProfilingSession(app, bin, browserInfo);
      
      profiledBins.current.add(bin);
      setProfilingSession(session);
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown profiling error");
      setProfilingError(err);
      setIsProfilingActive(false);
      onError?.(err);
    } finally {
      isInitiatingProfiling.current = false;
    }
  }, [enabled, app, onError]);
  
  return {
    shouldStartProfiling,
    startProfiling,
    profilingSession,
    profilingError,
    isProfilingActive,
  };
}