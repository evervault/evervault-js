import { PropsWithChildren } from "react";
import { EvervaultProvider } from "../EvervaultProvider";
import { act, renderHook } from "@testing-library/react-native";
import { useThreeDSecure } from "./useThreeDSecure";
import { ThreeDSecureEvent } from "./event";

function wrapper({ children }: PropsWithChildren) {
  return (
    <EvervaultProvider teamId="team_123" appId="app_123">
      {children}
    </EvervaultProvider>
  );
}

const callbacks = {
  onSuccess: vi.fn(),
  onError: vi.fn(),
  onFailure: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

it("returns the correct state", async () => {
  const { result } = await renderHook(() => useThreeDSecure(), {
    wrapper,
  });

  expect(result.current).toEqual({
    start: expect.any(Function),
    cancel: expect.any(Function),
    session: null,
    isVisible: false,
  });
});

it("starts a session when action is required", async () => {
  const { result } = await renderHook(() => useThreeDSecure(), {
    wrapper,
  });

  vi.spyOn(global, "fetch").mockResolvedValue({
    json: () => Promise.resolve({ status: "action-required" }),
  } as any);

  await act(() => result.current.start("session_123", callbacks));

  expect(result.current.session).toEqual({
    sessionId: "session_123",
    cancel: expect.any(Function),
    get: expect.any(Function),
  });
  expect(result.current.isVisible).toBe(true);
});

it("fails the session when failOnChallenge is true and a challenge is required", async () => {
  const { result } = await renderHook(() => useThreeDSecure(), {
    wrapper,
  });

  vi.spyOn(global, "fetch").mockResolvedValue({
    json: () => Promise.resolve({ status: "action-required" }),
  } as any);

  const onRequestChallenge = vi.fn();

  await act(() =>
    result.current.start("session_123", {
      ...callbacks,
      onRequestChallenge,
      failOnChallenge: true,
    })
  );

  expect(callbacks.onFailure).toHaveBeenCalled();
  expect(onRequestChallenge).not.toHaveBeenCalled();
});

it("fails the session when failOnChallenge is a function that returns true and a challenge is required", async () => {
  const { result } = await renderHook(() => useThreeDSecure(), {
    wrapper,
  });

  vi.spyOn(global, "fetch").mockResolvedValue({
    json: () => Promise.resolve({ status: "action-required" }),
  } as any);

  const onRequestChallenge = vi.fn();

  await act(() =>
    result.current.start("session_123", {
      ...callbacks,
      onRequestChallenge,
      failOnChallenge: () => Promise.resolve(true),
    })
  );

  expect(callbacks.onFailure).toHaveBeenCalled();
  expect(onRequestChallenge).not.toHaveBeenCalled();
});

it("fails the session when failOnChallenge resolves true at hook level and a challenge is required", async () => {
  const { result } = await renderHook(
    () =>
      useThreeDSecure({
        failOnChallenge: () => Promise.resolve(true),
      }),
    {
      wrapper,
    }
  );

  vi.spyOn(global, "fetch").mockResolvedValue({
    json: () => Promise.resolve({ status: "action-required" }),
  } as any);

  const onRequestChallenge = vi.fn();
  await act(() =>
    result.current.start("session_123", {
      ...callbacks,
      onRequestChallenge,
    })
  );

  expect(onRequestChallenge).not.toHaveBeenCalled();
  expect(callbacks.onFailure).toHaveBeenCalled();
});

it("fails the session when onRequestChallenge is called and defaultPrevented is true", async () => {
  const { result } = await renderHook(() => useThreeDSecure(), {
    wrapper,
  });

  vi.spyOn(global, "fetch").mockResolvedValue({
    json: () => Promise.resolve({ status: "action-required" }),
  } as any);

  let onRequestChallenge = vi.fn((event: ThreeDSecureEvent) =>
    event.preventDefault()
  );
  await act(() =>
    result.current.start("session_123", {
      ...callbacks,
      onRequestChallenge,
    })
  );
  expect(onRequestChallenge).toHaveBeenCalled();
  expect(callbacks.onFailure).toHaveBeenCalled();

  let onFailure = vi.fn();
  onRequestChallenge = vi.fn();
  await act(() =>
    result.current.start("session_123", {
      onFailure,
      onRequestChallenge,
    })
  );
  expect(onRequestChallenge).toHaveBeenCalled();
  expect(onFailure).not.toHaveBeenCalled();
});

it("calls the success callback when the session is successful", async () => {
  const { result } = await renderHook(() => useThreeDSecure(), {
    wrapper,
  });

  vi.spyOn(global, "fetch").mockResolvedValue({
    json: () => Promise.resolve({ status: "success" }),
  } as any);

  await act(() => result.current.start("session_123", callbacks));

  expect(callbacks.onSuccess).toHaveBeenCalled();
});

it("calls the failure callback when the session fails on start", async () => {
  const { result } = await renderHook(() => useThreeDSecure(), {
    wrapper,
  });

  vi.spyOn(global, "fetch").mockResolvedValue({
    json: () => Promise.resolve({ status: "failure" }),
  } as any);

  await act(() => result.current.start("session_123", callbacks));

  expect(callbacks.onFailure).toHaveBeenCalled();
});

it("calls the error callback when the fetch fails on start", async () => {
  const { result } = await renderHook(() => useThreeDSecure(), {
    wrapper,
  });

  vi.spyOn(global, "fetch").mockRejectedValue(new Error("Session failed"));

  await act(() => result.current.start("session_123", callbacks));

  expect(callbacks.onError).toHaveBeenCalled();
});

it("silently fails if the session is not found", async () => {
  const { result } = await renderHook(() => useThreeDSecure(), {
    wrapper,
  });

  const consoleWarnSpy = vi.spyOn(console, "warn");

  await act(() => result.current.cancel());

  expect(result.current.session).toBeNull();
  expect(result.current.isVisible).toBe(false);
  expect(consoleWarnSpy).toHaveBeenCalledWith("No 3DS session to cancel");
});

it("cancels the session when the user cancels", async () => {
  const { result } = await renderHook(() => useThreeDSecure(), {
    wrapper,
  });

  vi.spyOn(global, "fetch").mockResolvedValue({
    json: () => Promise.resolve({ status: "action-required" }),
  } as any);

  await act(() => result.current.start("session_123", callbacks));

  expect(result.current.session).toEqual({
    sessionId: "session_123",
    cancel: expect.any(Function),
    get: expect.any(Function),
  });
  expect(result.current.isVisible).toBe(true);

  await act(() => result.current.session?.cancel());

  expect(result.current.session).toEqual({
    sessionId: "session_123",
    cancel: expect.any(Function),
    get: expect.any(Function),
  });
  expect(result.current.isVisible).toBe(false);
  expect(callbacks.onFailure).toHaveBeenCalled();
});
