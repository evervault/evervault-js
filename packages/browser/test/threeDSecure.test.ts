import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  afterEach,
} from "vitest";
import ThreeDSecure from "../lib/ui/threeDSecure";
import { setupCrypto } from "./setup";
import type EvervaultClient from "../lib/main";

const apiUrl = "https://api.test.evervault.com";
const appId = "app_test123";
const session = "sess_abc123";
const patchUrl = `${apiUrl}/frontend/3ds/browser-sessions/${session}`;

type RecordedPatch = {
  body: unknown;
  appId: string | null;
};

function patchHandler(patchRequests: RecordedPatch[]) {
  return http.patch(patchUrl, async ({ request }) => {
    patchRequests.push({
      body: await request.json(),
      appId: request.headers.get("X-Evervault-App-Id"),
    });
    return HttpResponse.json({}, { status: 200 });
  });
}

const mockClient = {
  config: { appId, http: { apiUrl } },
} as unknown as EvervaultClient;

// Mock the EvervaultFrame class
class MockFrame {
  handlers = new Map<string, (...args: unknown[]) => void>();

  on(event: string, handler: (...args: unknown[]) => void) {
    this.handlers.set(event, handler);
    return this;
  }

  send() {}
  mount() {
    return this;
  }
  unmount() {
    return this;
  }
  createOverlay() {
    return document.createElement("div");
  }
  setSize() {}
  update() {}

  trigger(event: string, ...args: unknown[]) {
    this.handlers.get(event)?.(...args);
  }
}

let lastFrame: MockFrame;

// Hijack the EvervaultFrame class and return a mock instance
vi.mock("../lib/ui/evervaultFrame", () => ({
  EvervaultFrame: class {
    constructor() {
      // Expose the last frame instance to the test
      lastFrame = new MockFrame();
      return lastFrame;
    }
  },
}));

function createThreeDSecure(sessionId = session) {
  const tds = new ThreeDSecure(mockClient, sessionId);
  return { tds, frame: lastFrame };
}

const server = setupServer();

beforeAll(() => {
  setupCrypto();
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});

afterAll(() => {
  server.close();
});

describe("ThreeDSecure#handleOutcome idempotency", () => {
  it("only calls PATCH once when EV_CANCEL fires multiple times", async () => {
    const patchRequests: RecordedPatch[] = [];
    server.use(patchHandler(patchRequests));

    const failureHandler = vi.fn();
    const { tds, frame } = createThreeDSecure();
    const unmountSpy = vi.spyOn(frame, "unmount");
    tds.on("failure", failureHandler);

    lastFrame.trigger("EV_CANCEL");
    lastFrame.trigger("EV_CANCEL");
    lastFrame.trigger("EV_CANCEL");

    await vi.waitFor(() => {
      expect(patchRequests).toHaveLength(1);
    });

    expect(patchRequests[0]).toEqual({
      body: { outcome: "cancelled", cres: null },
      appId,
    });
    expect(failureHandler).toHaveBeenCalledTimes(1);
    expect(unmountSpy).toHaveBeenCalledTimes(1);
  });

  it("only dispatches the success callback once even if EV_SUCCESS fires multiple times", async () => {
    const patchRequests: RecordedPatch[] = [];
    server.use(patchHandler(patchRequests));

    const successHandler = vi.fn();
    const { tds, frame } = createThreeDSecure();
    const unmountSpy = vi.spyOn(frame, "unmount");
    tds.on("success", successHandler);

    lastFrame.trigger("EV_SUCCESS", null);
    lastFrame.trigger("EV_SUCCESS", null);
    lastFrame.trigger("EV_SUCCESS", null);

    await vi.waitFor(() => {
      expect(patchRequests).toHaveLength(1);
    });

    expect(patchRequests[0]).toEqual({
      body: { outcome: "success", cres: null },
      appId,
    });
    expect(successHandler).toHaveBeenCalledTimes(1);
    expect(unmountSpy).toHaveBeenCalledTimes(1);
  });

  it("only dispatches the failure callback once even if EV_FAILURE fires multiple times", async () => {
    const patchRequests: RecordedPatch[] = [];
    server.use(patchHandler(patchRequests));

    const failureHandler = vi.fn();
    const { tds, frame } = createThreeDSecure();
    const unmountSpy = vi.spyOn(frame, "unmount");
    tds.on("failure", failureHandler);

    lastFrame.trigger("EV_FAILURE", "cres_token");
    lastFrame.trigger("EV_FAILURE", "cres_token");
    lastFrame.trigger("EV_FAILURE", "cres_token");

    await vi.waitFor(() => {
      expect(patchRequests).toHaveLength(1);
    });

    expect(patchRequests[0]).toEqual({
      body: { outcome: "failure", cres: "cres_token" },
      appId,
    });
    expect(failureHandler).toHaveBeenCalledTimes(1);
    expect(unmountSpy).toHaveBeenCalledTimes(1);
  });

  it("only PATCHes aborted-on-challenge once when EV_FAILURE_FORCED_DUE_TO_CHALLENGE fires multiple times", async () => {
    const patchRequests: RecordedPatch[] = [];
    server.use(patchHandler(patchRequests));

    const failureHandler = vi.fn();
    const { tds, frame } = createThreeDSecure();
    const unmountSpy = vi.spyOn(frame, "unmount");
    tds.on("failure", failureHandler);

    lastFrame.trigger("EV_FAILURE_FORCED_DUE_TO_CHALLENGE", "cres_token");
    lastFrame.trigger("EV_FAILURE_FORCED_DUE_TO_CHALLENGE", "cres_token");
    lastFrame.trigger("EV_FAILURE_FORCED_DUE_TO_CHALLENGE", "cres_token");

    await vi.waitFor(() => {
      expect(patchRequests).toHaveLength(1);
    });

    expect(patchRequests[0]).toEqual({
      body: { outcome: "aborted-on-challenge", cres: "cres_token" },
      appId,
    });
    expect(failureHandler).toHaveBeenCalledTimes(1);
    expect(unmountSpy).toHaveBeenCalledTimes(1);
  });

  it("ignores a success event after a cancel has already been processed", async () => {
    const patchRequests: RecordedPatch[] = [];
    server.use(patchHandler(patchRequests));

    const failureHandler = vi.fn();
    const successHandler = vi.fn();
    const { tds } = createThreeDSecure();
    tds.on("failure", failureHandler);
    tds.on("success", successHandler);

    lastFrame.trigger("EV_CANCEL");
    await vi.waitFor(() => expect(patchRequests).toHaveLength(1));

    lastFrame.trigger("EV_SUCCESS", null);

    expect(patchRequests).toHaveLength(1);
    expect(patchRequests[0]).toEqual({
      body: { outcome: "cancelled", cres: null },
      appId,
    });
    expect(failureHandler).toHaveBeenCalledTimes(1);
    expect(successHandler).not.toHaveBeenCalled();
  });

  it("ignores a cancel event after a success has already been processed", async () => {
    const patchRequests: RecordedPatch[] = [];
    server.use(patchHandler(patchRequests));

    const failureHandler = vi.fn();
    const successHandler = vi.fn();
    const { tds } = createThreeDSecure();
    tds.on("failure", failureHandler);
    tds.on("success", successHandler);

    lastFrame.trigger("EV_SUCCESS", null);
    await vi.waitFor(() => expect(patchRequests).toHaveLength(1));

    lastFrame.trigger("EV_CANCEL");

    expect(patchRequests).toHaveLength(1);
    expect(patchRequests[0]).toEqual({
      body: { outcome: "success", cres: null },
      appId,
    });
    expect(successHandler).toHaveBeenCalledTimes(1);
    expect(failureHandler).not.toHaveBeenCalled();
  });

  it("ignores a cancel event after a failure has already been processed", async () => {
    const patchRequests: RecordedPatch[] = [];
    server.use(patchHandler(patchRequests));

    const failureHandler = vi.fn();
    const { tds } = createThreeDSecure();
    tds.on("failure", failureHandler);

    lastFrame.trigger("EV_FAILURE", "cres_token");
    await vi.waitFor(() => expect(patchRequests).toHaveLength(1));

    lastFrame.trigger("EV_CANCEL");

    expect(patchRequests).toHaveLength(1);
    expect(patchRequests[0]).toEqual({
      body: { outcome: "failure", cres: "cres_token" },
      appId,
    });
    expect(failureHandler).toHaveBeenCalledTimes(1);
  });

  it("resets the handled flag if fetch rejects (network error), allowing a retry", async () => {
    let callCount = 0;
    const originalFetch = globalThis.fetch;
    vi.spyOn(globalThis, "fetch").mockImplementation((...args) => {
      callCount++;
      if (callCount === 1) return Promise.reject(new Error("network error"));
      return originalFetch(...args);
    });

    const patchRequests: RecordedPatch[] = [];
    server.use(patchHandler(patchRequests));

    const successHandler = vi.fn();
    const { tds } = createThreeDSecure();
    tds.on("success", successHandler);

    // #updateOutcome does not check response.ok — only fetch rejections reset #handled
    lastFrame.trigger("EV_SUCCESS", null);
    await vi.waitFor(() => {
      expect(callCount).toBe(1);
    });
    expect(patchRequests).toHaveLength(0);
    expect(successHandler).not.toHaveBeenCalled();

    // Let the rejected fetch settle so #handleOutcome's catch resets #handled
    await new Promise((resolve) => setTimeout(resolve, 0));

    lastFrame.trigger("EV_SUCCESS", null);
    await vi.waitFor(() => {
      expect(patchRequests).toHaveLength(1);
    });

    expect(callCount).toBe(2);
    expect(patchRequests[0]).toEqual({
      body: { outcome: "success", cres: null },
      appId,
    });
    expect(successHandler).toHaveBeenCalledTimes(1);
  });
});
