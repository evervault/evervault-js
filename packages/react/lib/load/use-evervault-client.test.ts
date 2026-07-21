/**
 * @vitest-environment happy-dom
 */

import EvervaultClient from "@evervault/browser";
import { PromisifiedEvervaultClient } from "./client";
import { useEvervaultClient, type CustomConfig } from "./use-evervault-client";
import { act, renderHook } from "@testing-library/react";
import { vi, expect, afterEach, describe, it } from "vitest";
import { ScriptLoadError } from "./error";

const evervaultClientMock = vi.hoisted(() =>
  vi.fn(
    class {
      config: (CustomConfig & { teamId: string; appId: string }) | undefined;
      constructor(teamId: string, appId: string, customConfig?: CustomConfig) {
        this.config = { ...customConfig, teamId, appId };
      }
      static async init(
        teamId: string,
        appId: string,
        customConfig?: CustomConfig
      ) {
        return new this(teamId, appId, customConfig);
      }
    } as unknown as typeof EvervaultClient
  )
);

const injectScriptMock = vi.hoisted(() =>
  vi.fn(() => Promise.resolve(evervaultClientMock))
);

vi.mock(import("./inject-script"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    injectScript: injectScriptMock,
  };
});

vi.mock(import("@evervault/browser"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: evervaultClientMock,
  };
});

afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
  window.Evervault = undefined;
  delete window.Evervault;
});

describe("useEvervaultClient", () => {
  it("should return the client", () => {
    const { result } = renderHook(() =>
      useEvervaultClient({ teamId: "team_123", appId: "app_123" })
    );

    expect(result.current.client).toBeInstanceOf(PromisifiedEvervaultClient);
    expect(result.current.reload).toBeInstanceOf(Function);
  });

  it("should call onLoadError if the script fails to load", async () => {
    const error = new ScriptLoadError("evervault_not_available", "");
    injectScriptMock.mockReturnValue(Promise.reject(error));
    const onLoadError = vi.fn();
    const { result } = renderHook(() =>
      useEvervaultClient({ teamId: "team_123", appId: "app_123", onLoadError })
    );
    await expect(result.current.client).rejects.toThrow(error);
    expect(onLoadError).toHaveBeenCalledWith(error);
  });

  it("should call onLoadError if the script fails to load after timeout", async () => {
    const error = new ScriptLoadError("timed_out", "");
    injectScriptMock.mockReturnValueOnce(Promise.reject(error));
    const onLoadError = vi.fn();
    const { result } = renderHook(() =>
      useEvervaultClient({
        teamId: "team_123",
        appId: "app_123",
        onLoadError,
        timeout: 100,
      })
    );
    await expect(result.current.client).rejects.toThrow(error);
    expect(onLoadError).toHaveBeenCalledWith(error);
  });

  it("should allow manually reloading the client", async () => {
    const error = new ScriptLoadError("evervault_not_available", "");
    injectScriptMock.mockReturnValueOnce(Promise.reject(error));

    const onLoadError = vi.fn();
    const { result } = renderHook(() =>
      useEvervaultClient({ teamId: "team_123", appId: "app_123", onLoadError })
    );
    await expect(result.current.client).rejects.toThrow(error);
    expect(onLoadError).toHaveBeenCalledWith(error);

    act(() => result.current.reload());
    await expect(result.current.client).resolves.toBeInstanceOf(
      EvervaultClient
    );
  });

  it("should auto-reload the client if team ID changes", async () => {
    const { result, rerender } = renderHook(
      ({ teamId }: { teamId: string }) =>
        useEvervaultClient({ teamId, appId: "app_123" }),
      { initialProps: { teamId: "team_123" } }
    );
    const client = await result.current.client;
    expect(client).toBeInstanceOf(EvervaultClient);
    expect(client.config.teamId).toBe("team_123");

    rerender({ teamId: "team_456" });
    const newClient = await result.current.client;
    expect(newClient.config.teamId).toBe("team_456");
  });

  it("should auto-reload the client if app ID changes", async () => {
    const { result, rerender } = renderHook(
      ({ appId }: { appId: string }) =>
        useEvervaultClient({ teamId: "team_123", appId }),
      { initialProps: { appId: "app_123" } }
    );
    const client = await result.current.client;
    expect(client.config.appId).toBe("app_123");
    rerender({ appId: "app_456" });
    const newClient = await result.current.client;
    expect(newClient.config.appId).toBe("app_456");
  });

  it("should auto-reload the client if the jsSdkUrl changes", async () => {
    const { result, rerender } = renderHook(
      ({ jsSdkUrl }: { jsSdkUrl?: string }) =>
        useEvervaultClient({
          teamId: "team_123",
          appId: "app_123",
          customConfig: { jsSdkUrl },
        }),
      { initialProps: {} }
    );

    const client = await result.current.client;
    expect(client).toBeInstanceOf(EvervaultClient);
    expect(
      (client.config as unknown as CustomConfig)?.jsSdkUrl
    ).toBeUndefined();

    rerender({ jsSdkUrl: "https://js.evervault.com/v3" });

    const newClient = await result.current.client;
    expect((newClient.config as unknown as CustomConfig)?.jsSdkUrl).toBe(
      "https://js.evervault.com/v3"
    );
  });
});
