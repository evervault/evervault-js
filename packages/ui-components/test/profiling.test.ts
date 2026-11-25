import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProfilingRequest } from "../src/ThreeDSecure/types";

const API = "https://api.test";
const fetchMock = vi.fn<typeof fetch>();

const request: ProfilingRequest = {
  cardNumber: "4242424242424242",
  browser: {
    javaEnabled: false,
    javascriptEnabled: true,
    language: "en-IE",
    colorDepth: 24,
    screenHeight: 900,
    screenWidth: 1440,
    timeZone: 0,
    deviceId: "a1b2c3",
  },
  frame: { width: 500, height: 600 },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// The module reads the API URL when it loads, so load it after the URL is set.
async function importProfiling() {
  return import("../src/ThreeDSecure/profiling");
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("VITE_API_URL", API);
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("createProfiling", () => {
  it("posts the card, browser and frame for the app", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ profilingId: "tdp_0123456789ab" }),
    );
    const { createProfiling } = await importProfiling();

    await createProfiling("app_1", request);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API}/frontend/3ds/profiling`);
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({
      "X-Evervault-App-Id": "app_1",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(init?.body as string)).toEqual(request);
  });

  it("returns the profiling ID and the 3DS Method details", async () => {
    const body = {
      profilingId: "tdp_0123456789ab",
      methodUrl: "https://acs.test/method",
      threeDSMethodData: "eyJ0aHJlZURTU2VydmVyVHJhbnNJRCI6IjEifQ",
    };
    fetchMock.mockResolvedValue(jsonResponse(body));
    const { createProfiling } = await importProfiling();

    await expect(createProfiling("app_1", request)).resolves.toEqual(body);
  });

  it("returns only the profiling ID when the card has no 3DS Method", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ profilingId: "tdp_0123456789ab" }),
    );
    const { createProfiling } = await importProfiling();

    await expect(createProfiling("app_1", request)).resolves.toEqual({
      profilingId: "tdp_0123456789ab",
    });
  });

  it("throws a ProfilingError with the status when profiling is off", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 403));
    const { createProfiling, ProfilingError } = await importProfiling();

    const error: unknown = await createProfiling("app_1", request).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(ProfilingError);
    expect(error).toMatchObject({ status: 403 });
  });

  it("passes the abort signal to fetch", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ profilingId: "tdp_0123456789ab" }),
    );
    const { createProfiling } = await importProfiling();
    const controller = new AbortController();

    await createProfiling("app_1", request, controller.signal);

    expect(fetchMock.mock.calls[0][1]?.signal).toBe(controller.signal);
  });

  it("rejects when the request is aborted", async () => {
    fetchMock.mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });
    const { createProfiling } = await importProfiling();
    const controller = new AbortController();

    const result = createProfiling("app_1", request, controller.signal);
    controller.abort();

    await expect(result).rejects.toMatchObject({ name: "AbortError" });
  });
});

describe("reportProfilingMethod", () => {
  it("patches the 3DS Method status for the profiling ID", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const { reportProfilingMethod } = await importProfiling();

    await reportProfilingMethod("app_1", "tdp_0123456789ab", "timeout");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API}/frontend/3ds/profiling/tdp_0123456789ab`);
    expect(init?.method).toBe("PATCH");
    expect(init?.headers).toMatchObject({ "X-Evervault-App-Id": "app_1" });
    expect(JSON.parse(init?.body as string)).toEqual({
      browserFingerprint: "timeout",
    });
  });

  it("throws a ProfilingError on an error response", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 404));
    const { reportProfilingMethod, ProfilingError } = await importProfiling();

    await expect(
      reportProfilingMethod("app_1", "tdp_0123456789ab", "complete"),
    ).rejects.toBeInstanceOf(ProfilingError);
  });
});
