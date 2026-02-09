import { PropsWithChildren } from "react";
import { EvervaultProvider } from "../EvervaultProvider";
import { render, screen } from "@testing-library/react-native";
import { ThreeDSecure } from "./Root";
import { Text } from "react-native";

function wrapper({ children }: PropsWithChildren) {
  return (
    <EvervaultProvider teamId="team_123" appId="app_123">
      {children}
    </EvervaultProvider>
  );
}

it("renders null when the session is null", async () => {
  await render(
    <ThreeDSecure
      state={{
        session: null,
        isVisible: false,
        cancel: vi.fn(),
        start: vi.fn(),
      }}
    >
      <Text testID="child">Hello</Text>
    </ThreeDSecure>,
    { wrapper }
  );

  expect(screen.queryByTestId("child")).toBeNull();
});

it("renders null when the session is not visible", async () => {
  await render(
    <ThreeDSecure
      state={{
        session: { sessionId: "session_123", cancel: vi.fn(), get: vi.fn() },
        isVisible: false,
        cancel: vi.fn(),
        start: vi.fn(),
      }}
    >
      <Text testID="child">Hello</Text>
    </ThreeDSecure>,
    { wrapper }
  );

  expect(screen.queryByTestId("child")).toBeNull();
});

it("renders the children when the session defined and visible", async () => {
  await render(
    <ThreeDSecure
      state={{
        session: { sessionId: "session_123", cancel: vi.fn(), get: vi.fn() },
        isVisible: true,
        cancel: vi.fn(),
        start: vi.fn(),
      }}
    >
      <Text testID="child">Hello</Text>
    </ThreeDSecure>,
    { wrapper }
  );

  expect(screen.getByTestId("child")).toBeOnTheScreen();
});
