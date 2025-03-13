import { PropsWithChildren } from "react";
import { EvervaultProvider } from "../EvervaultProvider";
import { act, renderHook } from "@testing-library/react-native";
import { useThreeDSecure } from "./useThreeDSecure";

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

it("returns the correct state", () => {
  const { result } = renderHook(() => useThreeDSecure(), {
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
  const { result, rerender } = renderHook(() => useThreeDSecure(), {
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

it("calls the success callback when the session is successful", async () => {
  const { result } = renderHook(() => useThreeDSecure(), {
    wrapper,
  });

  vi.spyOn(global, "fetch").mockResolvedValue({
    json: () => Promise.resolve({ status: "success" }),
  } as any);

  await act(() => result.current.start("session_123", callbacks));

  expect(callbacks.onSuccess).toHaveBeenCalled();
});

it("calls the failure callback when the session fails on start", async () => {
  const { result } = renderHook(() => useThreeDSecure(), {
    wrapper,
  });

  vi.spyOn(global, "fetch").mockResolvedValue({
    json: () => Promise.resolve({ status: "failure" }),
  } as any);

  await act(() => result.current.start("session_123", callbacks));

  expect(callbacks.onFailure).toHaveBeenCalled();
});

it("calls the error callback when the fetch fails on start", async () => {
  const { result } = renderHook(() => useThreeDSecure(), {
    wrapper,
  });

  vi.spyOn(global, "fetch").mockRejectedValue(new Error("Session failed"));

  await act(() => result.current.start("session_123", callbacks));

  expect(callbacks.onError).toHaveBeenCalled();
});

it("silently fails if the session is not found", async () => {
  const { result } = renderHook(() => useThreeDSecure(), {
    wrapper,
  });

  const consoleWarnSpy = vi.spyOn(console, "warn");

  await act(() => result.current.cancel());

  expect(result.current.session).toBeNull();
  expect(result.current.isVisible).toBe(false);
  expect(consoleWarnSpy).toHaveBeenCalledWith("No 3DS session to cancel");
});

it("cancels the session when the user cancels", async () => {
  const { result } = renderHook(() => useThreeDSecure(), {
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
