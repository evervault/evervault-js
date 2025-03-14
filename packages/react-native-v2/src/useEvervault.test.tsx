import { renderHook } from "@testing-library/react-native";
import { useEvervault } from "./useEvervault";
import { EvervaultProvider } from "./EvervaultProvider";
import { PropsWithChildren } from "react";
import { ErrorBoundary } from "./utils";

it("throws an error if used outside of EvervaultProvider", () => {
  const onError = vi.fn();
  const wrapper = ({ children }: PropsWithChildren) => (
    <ErrorBoundary onError={onError}>{children}</ErrorBoundary>
  );

  renderHook(() => useEvervault(), { wrapper });
  expect(onError).toHaveBeenCalledWith(
    new Error("`useEvervault` must be used within an `EvervaultProvider`.")
  );
});

it("returns the config when used within EvervaultProvider", () => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <EvervaultProvider teamId="team_123" appId="app_123">
      {children}
    </EvervaultProvider>
  );

  const { result } = renderHook(() => useEvervault(), { wrapper });

  expect(result.current.appId).toBe("app_123");
  expect(result.current.teamId).toBe("team_123");
  expect(result.current.encrypt).toStrictEqual(expect.any(Function));
});
