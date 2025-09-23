import { useCallback, useEffect, useState, useRef } from "react";
import { useSearchParams } from "../utilities/useSearchParams";
import type { ProfiledSessionData } from "./types";

const API = import.meta.env.VITE_API_URL as string;

class SessionError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "SessionError";
    this.code = code;
  }
}

async function getProfiledSession(
  app: string,
  id: string
): Promise<ProfiledSessionData> {
  const response = await fetch(`${API}/frontend/3ds/browser-sessions/${id}`, {
    method: "GET",
    headers: {
      "X-Evervault-App-Id": app,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw new SessionError(
        "session-complete",
        "The session has already been completed (either successfully or unsuccessfully). Therefore, rendering the 3DS screen is not required."
      );
    }

    throw new SessionError(
      "session-not-found",
      "Failed to fetch 3DS Session. Please ensure you are passing a valid 3DS Session ID."
    );
  }

  return (await response.json()) as ProfiledSessionData;
}

interface UseProfiledSessionReturn {
  session: ProfiledSessionData | null;
  error: Error | null;
  isLoading: boolean;
}

export function useProfiledSession(
  sessionId: string
): UseProfiledSessionReturn {
  const initialized = useRef(false);
  const { app } = useSearchParams();
  const [session, setSession] = useState<ProfiledSessionData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    if (!app || !sessionId) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getProfiledSession(app, sessionId);
      setSession(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, [app, sessionId]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void fetchSession();
  }, [fetchSession]);

  return {
    session,
    error,
    isLoading,
  };
}
