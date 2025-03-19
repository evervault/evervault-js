import { PropsWithChildren, useContext } from "react";
import { EvervaultProvider } from "./EvervaultProvider";
import { renderHook } from "@testing-library/react-native";
import { EvervaultContext } from "./context";
import { sdk } from "./sdk";

it("renders context", () => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <EvervaultProvider teamId="team_123" appId="app_123">
      {children}
    </EvervaultProvider>
  );

  const initSpy = vi.spyOn(sdk, "initialize");
  const { result } = renderHook(() => useContext(EvervaultContext), {
    wrapper,
  });

  expect(initSpy).toHaveBeenCalledWith("team_123", "app_123");
  expect(result.current).toBeDefined();
  expect(result.current?.appId).toBe("app_123");
  expect(result.current?.teamId).toBe("team_123");
  expect(result.current?.encrypt).toStrictEqual(expect.any(Function));
});
