import { render } from "@testing-library/react-native";
import { WebView } from "../__mocks__/react-native-webview";
import { ThreeDSecureFrame } from "./Frame";
import { ErrorBoundary } from "../utils";
import { EvervaultProvider } from "../EvervaultProvider";
import { ThreeDSecure } from "./Root";
import { CHALLENGE_DOMAIN_3DS } from "./config";

vi.mock("react-native-webview", () => ({ WebView }));

it("throws an error if used outside of an EvervaultProvider", () => {
  const onError = vi.fn();
  render(
    <ErrorBoundary onError={onError}>
      <ThreeDSecureFrame />
    </ErrorBoundary>
  );

  expect(onError).toHaveBeenCalledWith(
    new Error("`useEvervault` must be used within an `EvervaultProvider`.")
  );
});

it("throws an error if used outside of a ThreeDSecure component", () => {
  const onError = vi.fn();
  render(
    <ErrorBoundary onError={onError}>
      <EvervaultProvider teamId="team_123" appId="app_123">
        <ThreeDSecureFrame />
      </EvervaultProvider>
    </ErrorBoundary>
  );

  expect(onError).toHaveBeenCalledWith(
    new Error(
      "`ThreeDSecure.Frame` must be used within a `ThreeDSecure` component."
    )
  );
});

it("renders null if there is no session", () => {
  const { queryByTestId } = render(
    <EvervaultProvider teamId="team_123" appId="app_123">
      <ThreeDSecure
        state={{
          session: null,
          isVisible: false,
          cancel: vi.fn(),
          start: vi.fn(),
        }}
      >
        <ThreeDSecureFrame />
      </ThreeDSecure>
    </EvervaultProvider>
  );

  expect(queryByTestId("webview")).toBeNull();
});

it("renders a webview with the correct url", () => {
  const { getByTestId, toJSON } = render(
    <EvervaultProvider teamId="team_123" appId="app_123">
      <ThreeDSecure
        state={{
          session: {
            sessionId: "session_123",
            cancel: vi.fn(),
            get: vi.fn(),
          },
          isVisible: true,
          cancel: vi.fn(),
          start: vi.fn(),
        }}
      >
        <ThreeDSecureFrame />
      </ThreeDSecure>
    </EvervaultProvider>
  );

  const webview = getByTestId("webview");
  expect(webview).toBeOnTheScreen();
  expect(webview).toHaveProp("source", {
    uri: `https://${CHALLENGE_DOMAIN_3DS}/?session=session_123&app=app_123&team=team_123`,
  });
  expect(webview).toHaveProp("hideKeyboardAccessoryView", true);
  expect(webview).toHaveProp("overScrollMode", "content");
});
