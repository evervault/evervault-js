/**
 * @vitest-environment jsdom
 */

import { act, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Card } from "../src/Card";
import {
  createProfiling,
  reportProfilingMethod,
} from "../src/ThreeDSecure/profiling";
import type { CardConfig } from "../src/Card/types";
import type { CardPayload } from "types";
import { input, node, settle } from "./helpers/card";

const { encrypt, send, validate } = vi.hoisted(() => ({
  encrypt: vi.fn(async (value: string) => `encrypted(${value})`),
  send: vi.fn(),
  validate: { request: () => {} },
}));

vi.mock("@evervault/react", () => ({
  useEvervault: () => ({ encrypt }),
}));

vi.mock("../src/utilities/useSearchParams", () => ({
  useSearchParams: () => ({ app: "app_test123", id: "frame1" }),
}));

vi.mock("../src/utilities/useMessaging", () => ({
  useMessaging: () => ({
    send,
    on: (type: string, callback: (payload: unknown) => void) => {
      if (type === "EV_VALIDATE") {
        validate.request = callback as () => void;
      }
      return () => {};
    },
  }),
}));

vi.mock("../src/ThreeDSecure/deviceId", () => ({
  getDeviceId: vi.fn(async () => "a1b2c3"),
}));

vi.mock("../src/ThreeDSecure/profiling", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../src/ThreeDSecure/profiling")>();
  return {
    ProfilingError: actual.ProfilingError,
    createProfiling: vi.fn(),
    reportProfilingMethod: vi.fn(),
  };
});

const create = vi.mocked(createProfiling);
const report = vi.mocked(reportProfilingMethod);

const VISA = "4242424242424242";

function card(
  config: CardConfig = { threeDSProfiling: true },
  fields: ("number" | "expiry" | "cvc")[] = ["number"],
) {
  const { container } = render(
    <Card config={{ ...config, fields: fields.map((type) => node(type)) }} />,
  );
  return container;
}

function sent(message: string): CardPayload[] {
  return send.mock.calls
    .filter(([type]) => type === message)
    .map(([, payload]) => payload as CardPayload);
}

function lastChange() {
  return sent("EV_CHANGE").at(-1);
}

function methodFrame() {
  return document.querySelector("iframe[name=browserFingerprintFrame]");
}

beforeEach(() => {
  create.mockResolvedValue({ profilingId: "tdp_0123456789ab" });
  report.mockResolvedValue(undefined);
  // jsdom can't post a form into a frame.
  vi.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("3DS profiling in the card", () => {
  it("does not profile without the threeDSProfiling option", async () => {
    const container = card({});

    await userEvent.type(input(container, "number"), VISA);
    await settle();

    expect(create).not.toHaveBeenCalled();
    expect(lastChange()?.threeDSProfilingId).toBeNull();
  });

  it("does not profile a number that is not complete", async () => {
    const container = card();

    await userEvent.type(input(container, "number"), "424242424242");
    await settle();

    expect(create).not.toHaveBeenCalled();
  });

  it("profiles a valid number for the frame's app", async () => {
    const container = card();

    await userEvent.type(input(container, "number"), VISA);

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create.mock.calls[0][0]).toBe("app_test123");
    expect(create.mock.calls[0][1].cardNumber).toBe(VISA);
  });

  it("sends a change with the profiling ID when profiling finishes", async () => {
    const container = card();

    await userEvent.type(input(container, "number"), VISA);

    await waitFor(() =>
      expect(lastChange()?.threeDSProfilingId).toBe("tdp_0123456789ab"),
    );
    expect(lastChange()?.card.number).toBe(`encrypted(${VISA})`);
  });

  it("sends a null ID again when the number changes", async () => {
    const container = card();
    const number = input(container, "number");
    await userEvent.type(number, VISA);
    await waitFor(() =>
      expect(lastChange()?.threeDSProfilingId).toBe("tdp_0123456789ab"),
    );

    await userEvent.type(number, "{Backspace}");
    await settle();

    expect(lastChange()?.threeDSProfilingId).toBeNull();
  });

  it("keeps the ID when the shopper types in another field", async () => {
    const container = card({ threeDSProfiling: true }, [
      "number",
      "expiry",
      "cvc",
    ]);
    await userEvent.type(input(container, "number"), VISA);
    await waitFor(() =>
      expect(lastChange()?.threeDSProfilingId).toBe("tdp_0123456789ab"),
    );
    const changes = sent("EV_CHANGE").length;

    await userEvent.type(input(container, "expiry"), "1230");
    await userEvent.type(input(container, "cvc"), "123");
    await settle();

    expect(sent("EV_CHANGE").length).toBeGreaterThan(changes);
    expect(lastChange()?.card.expiry.month).toBe("12");
    expect(lastChange()?.threeDSProfilingId).toBe("tdp_0123456789ab");
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("gives the ID when the host asks the card to validate", async () => {
    const container = card();
    await userEvent.type(input(container, "number"), VISA);
    await waitFor(() =>
      expect(lastChange()?.threeDSProfilingId).toBe("tdp_0123456789ab"),
    );

    act(() => validate.request());
    await settle();

    expect(sent("EV_VALIDATED").at(-1)?.threeDSProfilingId).toBe(
      "tdp_0123456789ab",
    );
  });

  describe("with a 3DS Method", () => {
    beforeEach(() => {
      create.mockResolvedValue({
        profilingId: "tdp_0123456789ab",
        methodUrl: "https://acs.test/method",
        threeDSMethodData: "eyJ0aHJlZURTU2VydmVyVHJhbnNJRCI6IjEifQ",
      });
    });

    it("loads the 3DS Method in a hidden frame", async () => {
      const container = card();

      await userEvent.type(input(container, "number"), VISA);

      await waitFor(() => expect(methodFrame()).not.toBeNull());
      expect(container.querySelector("fieldset iframe")).toBeNull();
      expect(lastChange()?.threeDSProfilingId).toBeNull();
    });

    it("sends the ID after the 3DS Method finishes", async () => {
      const container = card();
      await userEvent.type(input(container, "number"), VISA);
      await waitFor(() => expect(methodFrame()).not.toBeNull());

      act(() => {
        window.dispatchEvent(
          new MessageEvent("message", {
            data: { event: "ev-3ds-trampoline" },
          }),
        );
      });

      await waitFor(() =>
        expect(lastChange()?.threeDSProfilingId).toBe("tdp_0123456789ab"),
      );
      expect(report).toHaveBeenCalledWith(
        "app_test123",
        "tdp_0123456789ab",
        "complete",
        expect.any(AbortSignal),
      );
      expect(methodFrame()).toBeNull();
    });
  });
});
