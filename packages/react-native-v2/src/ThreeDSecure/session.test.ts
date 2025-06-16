import { EV_API_DOMAIN } from "./config";
import {
  pollSession,
  startSession,
  stopPolling,
  threeDSecureSession,
} from "./session";
import { ThreeDSecureSession } from "./types";

describe("stopPolling", () => {
  it("should stop polling", () => {
    const spy = vi.spyOn(global, "clearInterval");

    const interval = setTimeout(() => {}, 0);
    const intervalRef = { current: interval };
    const setIsVisible = vi.fn();

    stopPolling(intervalRef, setIsVisible);

    expect(setIsVisible).toHaveBeenCalledWith(false);
    expect(spy).toHaveBeenCalledWith(interval);
    expect(intervalRef.current).toBeNull();
  });
});

describe("startSession", () => {
  const options = {
    onSuccess: vi.fn(),
    onFailure: vi.fn(),
    onError: vi.fn(),
  };
  const intervalRef = { current: null };
  const setIsVisible = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should start a successful session", async () => {
    const session: ThreeDSecureSession = {
      cancel: vi.fn(),
      get: vi.fn(() => Promise.resolve({ status: "success" }) as any),
      sessionId: "123",
    };

    await startSession(session, options, intervalRef, setIsVisible);

    expect(session.get).toHaveBeenCalled();
    expect(options.onSuccess).toHaveBeenCalled();
  });

  it("should start a failed session", async () => {
    const session: ThreeDSecureSession = {
      cancel: vi.fn(),
      get: vi.fn(() => Promise.resolve({ status: "failure" }) as any),
      sessionId: "123",
    };

    await startSession(session, options, intervalRef, setIsVisible);

    expect(session.get).toHaveBeenCalled();
    expect(options.onFailure).toHaveBeenCalledWith(
      new Error("3DS session failed")
    );
  });

  it("should start a session that requires action", async () => {
    const session: ThreeDSecureSession = {
      cancel: vi.fn(),
      get: vi.fn(() => Promise.resolve({ status: "action-required" }) as any),
      sessionId: "123",
    };

    await startSession(session, options, intervalRef, setIsVisible);

    expect(session.get).toHaveBeenCalled();
    expect(setIsVisible).toHaveBeenCalledWith(true);
  });

  it("should fail the session when failOnChallenge is true and a challenge is required", async () => {
    const session: ThreeDSecureSession = {
      cancel: vi.fn(),
      get: vi.fn(() => Promise.resolve({ status: "action-required" }) as any),
      sessionId: "123",
    };

    await startSession(
      session,
      { ...options, failOnChallenge: true },
      intervalRef,
      setIsVisible
    );

    expect(session.get).toHaveBeenCalled();
    expect(options.onFailure).toHaveBeenCalledWith(
      new Error("3DS session failed")
    );
  });

  it("should fail the session when failOnChallenge is a function that returns true and a challenge is required", async () => {
    const session: ThreeDSecureSession = {
      cancel: vi.fn(),
      get: vi.fn(() => Promise.resolve({ status: "action-required" }) as any),
      sessionId: "123",
    };

    await startSession(
      session,
      { ...options, failOnChallenge: () => Promise.resolve(true) },
      intervalRef,
      setIsVisible
    );

    expect(session.get).toHaveBeenCalled();
    expect(options.onFailure).toHaveBeenCalledWith(
      new Error("3DS session failed")
    );
  });

  it("should call onRequestChallenge when a challenge is required", async () => {
    const session: ThreeDSecureSession = {
      cancel: vi.fn(),
      get: vi.fn(() => Promise.resolve({ status: "action-required" }) as any),
      sessionId: "123",
    };

    const onRequestChallenge = vi.fn();

    await startSession(
      session,
      { ...options, onRequestChallenge },
      intervalRef,
      setIsVisible
    );

    expect(session.get).toHaveBeenCalled();
    expect(onRequestChallenge).toHaveBeenCalled();
    expect(options.onFailure).not.toHaveBeenCalled();
  });

  it("should fail the session when onRequestChallenge is called and default is prevented", async () => {
    const session: ThreeDSecureSession = {
      cancel: vi.fn(),
      get: vi.fn(() => Promise.resolve({ status: "action-required" }) as any),
      sessionId: "123",
    };

    const onRequestChallenge = vi.fn((event: Event) => {
      event.preventDefault();
    });

    await startSession(
      session,
      { ...options, onRequestChallenge },
      intervalRef,
      setIsVisible
    );

    expect(session.get).toHaveBeenCalled();
    expect(onRequestChallenge).toHaveBeenCalled();
    expect(options.onFailure).toHaveBeenCalledWith(
      new Error("3DS session failed")
    );
  });

  it("should call onError if the session fails to start", async () => {
    const session: ThreeDSecureSession = {
      cancel: vi.fn(),
      get: vi.fn(() => Promise.reject(new Error("Failed to start session"))),
      sessionId: "123",
    };

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await startSession(session, options, intervalRef, setIsVisible);

    expect(session.get).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error checking session state",
      new Error("Failed to start session")
    );
    expect(options.onError).toHaveBeenCalledWith(
      new Error("Failed to check 3DS session state")
    );
  });
});

describe("pollSession", () => {
  const options = {
    onSuccess: vi.fn(),
    onFailure: vi.fn(),
    onError: vi.fn(),
  };
  const intervalRef = { current: null };
  const setIsVisible = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should start an interval", () => {
    const session: ThreeDSecureSession = {
      cancel: vi.fn(),
      get: vi.fn(() => Promise.resolve({ status: "success" }) as any),
      sessionId: "123",
    };

    const intervalSpy = vi.spyOn(global, "setInterval");
    pollSession(session, options, intervalRef, setIsVisible);

    expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 3000);
  });

  it("should poll successful session", async () => {
    const session: ThreeDSecureSession = {
      cancel: vi.fn(),
      get: vi.fn(() => Promise.resolve({ status: "success" }) as any),
      sessionId: "123",
    };

    const intervalSpy = vi.spyOn(global, "setInterval");
    pollSession(session, options, intervalRef, setIsVisible);
    await intervalSpy.mock.calls[0][0]();

    expect(session.get).toHaveBeenCalled();
    expect(options.onSuccess).toHaveBeenCalled();
  });

  it("should poll failed session", async () => {
    const session: ThreeDSecureSession = {
      cancel: vi.fn(),
      get: vi.fn(() => Promise.resolve({ status: "failure" }) as any),
      sessionId: "123",
    };

    const intervalSpy = vi.spyOn(global, "setInterval");
    pollSession(session, options, intervalRef, setIsVisible);
    await intervalSpy.mock.calls[0][0]();

    expect(session.get).toHaveBeenCalled();
    expect(options.onFailure).toHaveBeenCalledWith(
      new Error("3DS session failed")
    );
  });

  it("should poll session that requires action", async () => {
    const session: ThreeDSecureSession = {
      cancel: vi.fn(),
      get: vi.fn(() => Promise.resolve({ status: "action-required" }) as any),
      sessionId: "123",
    };

    const intervalSpy = vi.spyOn(global, "setInterval");
    pollSession(session, options, intervalRef, setIsVisible);
    await intervalSpy.mock.calls[0][0]();

    expect(session.get).toHaveBeenCalled();
    expect(setIsVisible).toHaveBeenCalledWith(true);
  });

  it("should fail the session when failOnChallenge is true and a challenge is required", async () => {
    const session: ThreeDSecureSession = {
      cancel: vi.fn(),
      get: vi.fn(() => Promise.resolve({ status: "action-required" }) as any),
      sessionId: "123",
    };

    const intervalSpy = vi.spyOn(global, "setInterval");
    const onRequestChallenge = vi.fn();
    pollSession(
      session,
      { ...options, failOnChallenge: true, onRequestChallenge },
      intervalRef,
      setIsVisible
    );
    await intervalSpy.mock.calls[0][0]();

    expect(session.get).toHaveBeenCalled();
    expect(onRequestChallenge).not.toHaveBeenCalled();
    expect(options.onFailure).toHaveBeenCalledWith(
      new Error("3DS session failed")
    );
  });

  it("should fail the session when failOnChallenge is a function that returns true and a challenge is required", async () => {
    const session: ThreeDSecureSession = {
      cancel: vi.fn(),
      get: vi.fn(() => Promise.resolve({ status: "action-required" }) as any),
      sessionId: "123",
    };

    const intervalSpy = vi.spyOn(global, "setInterval");
    const onRequestChallenge = vi.fn();
    pollSession(
      session,
      {
        ...options,
        onRequestChallenge,
        failOnChallenge: () => Promise.resolve(true),
      },
      intervalRef,
      setIsVisible
    );
    await intervalSpy.mock.calls[0][0]();

    expect(session.get).toHaveBeenCalled();
    expect(onRequestChallenge).not.toHaveBeenCalled();
    expect(options.onFailure).toHaveBeenCalledWith(
      new Error("3DS session failed")
    );
  });

  it("should call onRequestChallenge when a challenge is required", async () => {
    const session: ThreeDSecureSession = {
      cancel: vi.fn(),
      get: vi.fn(() => Promise.resolve({ status: "action-required" }) as any),
      sessionId: "123",
    };

    const intervalSpy = vi.spyOn(global, "setInterval");
    const onRequestChallenge = vi.fn();
    pollSession(
      session,
      { ...options, onRequestChallenge },
      intervalRef,
      setIsVisible
    );
    await intervalSpy.mock.calls[0][0]();

    expect(session.get).toHaveBeenCalled();
    expect(onRequestChallenge).toHaveBeenCalled();
    expect(options.onFailure).not.toHaveBeenCalled();
  });

  it("should fail the session when onRequestChallenge is called and default is prevented", async () => {
    const session: ThreeDSecureSession = {
      cancel: vi.fn(),
      get: vi.fn(() => Promise.resolve({ status: "action-required" }) as any),
      sessionId: "123",
    };

    const intervalSpy = vi.spyOn(global, "setInterval");
    const onRequestChallenge = vi.fn((event: Event) => {
      event.preventDefault();
    });
    pollSession(
      session,
      { ...options, onRequestChallenge },
      intervalRef,
      setIsVisible
    );
    await intervalSpy.mock.calls[0][0]();

    expect(session.get).toHaveBeenCalled();
    expect(onRequestChallenge).toHaveBeenCalled();
    expect(options.onFailure).toHaveBeenCalledWith(
      new Error("3DS session failed")
    );
  });

  it("should call onError if the session fails to poll", async () => {
    const session: ThreeDSecureSession = {
      cancel: vi.fn(),
      get: vi.fn(() => Promise.reject(new Error("Failed to poll session"))),
      sessionId: "123",
    };

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const intervalSpy = vi.spyOn(global, "setInterval");
    pollSession(session, options, intervalRef, setIsVisible);
    await intervalSpy.mock.calls[0][0]();

    expect(session.get).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error polling session",
      new Error("Failed to poll session")
    );
    expect(options.onError).toHaveBeenCalledWith(
      new Error("Error polling 3DS session")
    );
  });
});

describe("threeDSecureSession", () => {
  const options = {
    onSuccess: vi.fn(),
    onFailure: vi.fn(),
    onError: vi.fn(),
  };
  const intervalRef = { current: null };
  const setIsVisible = vi.fn();

  it("should create a session", () => {
    const session = threeDSecureSession({
      sessionId: "123",
      appId: "app_123",
      options,
      intervalRef,
      setIsVisible,
    });

    expect(session).toBeDefined();
    expect(session.sessionId).toBe("123");
    expect(session.get).toBeInstanceOf(Function);
    expect(session.cancel).toBeInstanceOf(Function);
  });

  it("creates a get function that fetches the session", async () => {
    const session = threeDSecureSession({
      sessionId: "123",
      appId: "app_123",
      options,
      intervalRef,
      setIsVisible,
    });

    const fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy.mockImplementation(
      () =>
        Promise.resolve({
          json: () => Promise.resolve({ status: "success" }),
        }) as any
    );

    const result = await session.get();
    expect(fetchSpy).toHaveBeenCalledWith(
      `https://${EV_API_DOMAIN}/frontend/3ds/browser-sessions/123`,
      {
        headers: {
          "x-evervault-app-id": "app_123",
        },
      }
    );

    expect(result).toEqual({ status: "success" });
  });

  it("creates a get function that throws an error if the session fails to fetch", async () => {
    const session = threeDSecureSession({
      sessionId: "123",
      appId: "app_123",
      options,
      intervalRef,
      setIsVisible,
    });

    const fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy.mockImplementation(() =>
      Promise.reject(new Error("Failed to fetch session"))
    );

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(session.get()).rejects.toThrow("Failed to fetch session");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching 3DS session status",
      new Error("Failed to fetch session")
    );
  });

  it("creates a cancel function that cancels the session", async () => {
    const session = threeDSecureSession({
      sessionId: "123",
      appId: "app_123",
      options,
      intervalRef,
      setIsVisible,
    });

    const fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy.mockImplementation(() => Promise.resolve({}) as any);

    await session.cancel();

    expect(fetchSpy).toHaveBeenCalledWith(
      `https://${EV_API_DOMAIN}/frontend/3ds/browser-sessions/123`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-evervault-app-id": "app_123",
        },
        body: JSON.stringify({ outcome: "cancelled" }),
      }
    );

    expect(options.onFailure).toHaveBeenCalledWith(
      new Error("3DS session cancelled by user")
    );
  });

  it("creates a cancel function that throws an error if the session fails to cancel", async () => {
    const session = threeDSecureSession({
      sessionId: "123",
      appId: "app_123",
      options,
      intervalRef,
      setIsVisible,
    });

    const fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy.mockImplementation(() =>
      Promise.reject(new Error("Failed to cancel session"))
    );

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(session.cancel()).rejects.toThrow("Failed to cancel session");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error cancelling 3DS session",
      new Error("Failed to cancel session")
    );
  });
});
