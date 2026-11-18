/**
 * @vitest-environment jsdom
 */

import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThreeDSecure } from "../src/ThreeDSecure";

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("../src/utilities/useSearchParams", () => ({
  useSearchParams: () => ({ app: "app_test123", id: "frame1" }),
}));

vi.mock("../src/utilities/useMessaging", () => ({
  useMessaging: () => ({ send, on: () => () => {} }),
}));

const SESSION = "tds_visa_0123456789ab";

function sentTypes() {
  return send.mock.calls.map(([type]) => type as string);
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("ThreeDSecure with a session that is already complete", () => {
  // A profiled session can be final before the component mounts. The API then
  // answers the first browser-details update with the final status.
  it.each([
    ["success", "EV_SUCCESS"],
    ["failure", "EV_FAILURE"],
  ])(
    "sends the result for a %s session without showing the window",
    async (status, message) => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ status, nextAction: null }), {
          status: 200,
        })
      );

      const { container } = render(
        <ThreeDSecure config={{ session: SESSION, isOverlay: true }} />
      );

      await waitFor(() => expect(sentTypes()).toContain(message));
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "PATCH" });
      expect(sentTypes()).not.toContain("EV_ERROR");
      expect(sentTypes()).not.toContain("EV_SHOW");
      expect(container.querySelector("iframe")).toBeNull();
    }
  );
});
