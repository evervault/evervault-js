/**
 * @vitest-environment jsdom
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDeviceId } from "../src/ThreeDSecure/deviceId";
import {
  createProfiling,
  ProfilingError,
  reportProfilingMethod,
} from "../src/ThreeDSecure/profiling";
import { useThreeDSProfiling } from "../src/ThreeDSecure/useThreeDSProfiling";

vi.mock("../src/ThreeDSecure/deviceId", () => ({ getDeviceId: vi.fn() }));
vi.mock("../src/ThreeDSecure/profiling", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../src/ThreeDSecure/profiling")
  >();
  return {
    ProfilingError: actual.ProfilingError,
    createProfiling: vi.fn(),
    reportProfilingMethod: vi.fn(),
  };
});

const create = vi.mocked(createProfiling);
const report = vi.mocked(reportProfilingMethod);
const deviceId = vi.mocked(getDeviceId);

const VISA = "4242424242424242";
const MASTERCARD = "5555555555554444";

type Props = Parameters<typeof useThreeDSProfiling>[0];

function renderProfiling(props: Partial<Props> = {}) {
  return renderHook((p: Props) => useThreeDSProfiling(p), {
    initialProps: { enabled: true, app: "app_1", cardNumber: VISA, ...props },
  });
}

/** A promise that the test resolves or rejects when it wants to. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function abortable<T>() {
  return (_app: string, _request: unknown, signal?: AbortSignal) =>
    new Promise<T>((_resolve, reject) => {
      signal?.addEventListener("abort", () => {
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
}

const withMethod = {
  profilingId: "tdp_0123456789ab",
  methodUrl: "https://acs.test/method",
  threeDSMethodData: "eyJ0aHJlZURTU2VydmVyVHJhbnNJRCI6IjEifQ",
};

beforeEach(() => {
  deviceId.mockResolvedValue("a1b2c3");
  create.mockResolvedValue({ profilingId: "tdp_0123456789ab" });
  report.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("useThreeDSProfiling", () => {
  it("does nothing when profiling is off", async () => {
    const { result } = renderProfiling({ enabled: false });
    await act(async () => {});

    expect(deviceId).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(result.current.profilingId).toBeNull();
  });

  it("does nothing without an app ID", async () => {
    renderProfiling({ app: "" });
    await act(async () => {});

    expect(create).not.toHaveBeenCalled();
  });

  it("reads the device ID before the card number is valid", async () => {
    renderProfiling({ cardNumber: null });
    await act(async () => {});

    expect(deviceId).toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("sends the card number, browser details with the device ID, and frame size", async () => {
    renderProfiling();

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    const [app, request, signal] = create.mock.calls[0];
    expect(app).toBe("app_1");
    expect(request).toEqual({
      cardNumber: VISA,
      browser: expect.objectContaining({
        javascriptEnabled: true,
        deviceId: "a1b2c3",
      }) as unknown,
      frame: { width: expect.any(Number), height: expect.any(Number) },
    });
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  it("sends the request without a device ID when there is none", async () => {
    deviceId.mockResolvedValue(null);
    renderProfiling();

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create.mock.calls[0][1].browser).not.toHaveProperty("deviceId");
  });

  it("gives the profiling ID at once when the card has no 3DS Method", async () => {
    const { result } = renderProfiling();

    await waitFor(() =>
      expect(result.current.profilingId).toBe("tdp_0123456789ab")
    );
    expect(result.current.method).toBeNull();
  });

  describe("with a 3DS Method", () => {
    beforeEach(() => {
      create.mockResolvedValue(withMethod);
    });

    it("gives the 3DS Method and holds the profiling ID", async () => {
      const { result } = renderProfiling();

      await waitFor(() =>
        expect(result.current.method).toEqual({
          type: "browser-fingerprint",
          url: withMethod.methodUrl,
          data: withMethod.threeDSMethodData,
        })
      );
      expect(result.current.profilingId).toBeNull();
    });

    it("gives the ID only after the backend knows the 3DS Method finished", async () => {
      const update = deferred<undefined>();
      report.mockReturnValue(update.promise);
      const { result } = renderProfiling();
      await waitFor(() => expect(result.current.method).not.toBeNull());

      act(() => result.current.onMethodComplete());

      expect(report).toHaveBeenCalledWith(
        "app_1",
        "tdp_0123456789ab",
        "complete",
        expect.any(AbortSignal)
      );
      expect(result.current.method).toBeNull();
      expect(result.current.profilingId).toBeNull();

      await act(async () => update.resolve(undefined));

      expect(result.current.profilingId).toBe("tdp_0123456789ab");
    });

    it("still gives the ID when the 'complete' update fails", async () => {
      report.mockRejectedValue(new ProfilingError(500));
      const { result } = renderProfiling();
      await waitFor(() => expect(result.current.method).not.toBeNull());

      act(() => result.current.onMethodComplete());

      await waitFor(() =>
        expect(result.current.profilingId).toBe("tdp_0123456789ab")
      );
    });

    it("gives no ID when the 'complete' update gets a 404", async () => {
      report.mockRejectedValue(new ProfilingError(404));
      const { result } = renderProfiling();
      await waitFor(() => expect(result.current.method).not.toBeNull());

      act(() => result.current.onMethodComplete());
      await act(async () => {});

      expect(report).toHaveBeenCalledTimes(1);
      expect(result.current.profilingId).toBeNull();
    });

    it("gives the ID at once on a timeout, and does not wait for the update", async () => {
      report.mockReturnValue(new Promise(() => undefined));
      const { result } = renderProfiling();
      await waitFor(() => expect(result.current.method).not.toBeNull());

      act(() => result.current.onMethodTimeout());

      expect(report).toHaveBeenCalledWith(
        "app_1",
        "tdp_0123456789ab",
        "timeout"
      );
      expect(result.current.method).toBeNull();
      expect(result.current.profilingId).toBe("tdp_0123456789ab");
    });

    it("ignores a failed 'timeout' update", async () => {
      report.mockRejectedValue(new ProfilingError(500));
      const { result } = renderProfiling();
      await waitFor(() => expect(result.current.method).not.toBeNull());

      act(() => result.current.onMethodTimeout());
      await act(async () => {});

      expect(result.current.profilingId).toBe("tdp_0123456789ab");
    });

    it("keeps the callbacks the same between renders", async () => {
      const { result } = renderProfiling();
      const { onMethodComplete, onMethodTimeout } = result.current;

      await waitFor(() => expect(result.current.method).not.toBeNull());

      expect(result.current.onMethodComplete).toBe(onMethodComplete);
      expect(result.current.onMethodTimeout).toBe(onMethodTimeout);
    });

    it("drops the 3DS Method when the number changes", async () => {
      const { result, rerender } = renderProfiling();
      await waitFor(() => expect(result.current.method).not.toBeNull());

      rerender({ enabled: true, app: "app_1", cardNumber: null });

      expect(result.current.method).toBeNull();
      act(() => result.current.onMethodComplete());
      expect(report).not.toHaveBeenCalled();
    });

    it("does not give an old ID when the number changes during the 'complete' update", async () => {
      const update = deferred<undefined>();
      report.mockReturnValue(update.promise);
      const { result, rerender } = renderProfiling();
      await waitFor(() => expect(result.current.method).not.toBeNull());
      act(() => result.current.onMethodComplete());

      rerender({ enabled: true, app: "app_1", cardNumber: null });
      await act(async () => update.resolve(undefined));

      expect(result.current.profilingId).toBeNull();
    });
  });

  describe("when the number changes", () => {
    it("clears the ID", async () => {
      const { result, rerender } = renderProfiling();
      await waitFor(() => expect(result.current.profilingId).not.toBeNull());

      rerender({ enabled: true, app: "app_1", cardNumber: null });

      expect(result.current.profilingId).toBeNull();
    });

    it("aborts the request for the old number and profiles the new one", async () => {
      create.mockImplementationOnce(abortable());
      create.mockResolvedValueOnce({ profilingId: "tdp_new000000000" });
      const { result, rerender } = renderProfiling();
      await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
      const oldSignal = create.mock.calls[0][2];

      rerender({ enabled: true, app: "app_1", cardNumber: MASTERCARD });

      expect(oldSignal?.aborted).toBe(true);
      await waitFor(() =>
        expect(result.current.profilingId).toBe("tdp_new000000000")
      );
      expect(create.mock.calls[1][1].cardNumber).toBe(MASTERCARD);
    });

    it("ignores a late result for the old number", async () => {
      const old = deferred<{ profilingId: string }>();
      create.mockReturnValueOnce(old.promise);
      const { result, rerender } = renderProfiling();
      await waitFor(() => expect(create).toHaveBeenCalledTimes(1));

      rerender({ enabled: true, app: "app_1", cardNumber: null });
      await act(async () => old.resolve({ profilingId: "tdp_old000000000" }));

      expect(result.current.profilingId).toBeNull();
    });
  });

  describe("on an error", () => {
    it.each([403, 404])("stops profiling after a %i", async (status) => {
      create.mockRejectedValue(new ProfilingError(status));
      const { result, rerender } = renderProfiling();
      await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
      await act(async () => {});

      rerender({ enabled: true, app: "app_1", cardNumber: MASTERCARD });
      await act(async () => {});

      expect(create).toHaveBeenCalledTimes(1);
      expect(result.current.profilingId).toBeNull();
    });

    it.each([
      ["a 400", new ProfilingError(400)],
      ["a 500", new ProfilingError(500)],
      ["a network error", new TypeError("Failed to fetch")],
    ])("tries again with the next number after %s", async (_name, error) => {
      create.mockRejectedValueOnce(error);
      const { result, rerender } = renderProfiling();
      await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
      await act(async () => {});
      expect(result.current.profilingId).toBeNull();

      rerender({ enabled: true, app: "app_1", cardNumber: MASTERCARD });

      await waitFor(() =>
        expect(result.current.profilingId).toBe("tdp_0123456789ab")
      );
      expect(create).toHaveBeenCalledTimes(2);
    });
  });
});
