import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const load = vi.fn();

vi.mock("@fingerprintjs/fingerprintjs", () => ({ load }));

async function importGetDeviceId() {
  const module = await import("../src/ThreeDSecure/deviceId");
  return module.getDeviceId;
}

beforeEach(() => {
  // A new module for each test, so the saved ID starts empty.
  vi.resetModules();
  get.mockReset().mockResolvedValue({ visitorId: "a1b2c3" });
  load.mockReset().mockResolvedValue({ get });
});

describe("getDeviceId", () => {
  it("returns the FingerprintJS visitor ID", async () => {
    const getDeviceId = await importGetDeviceId();

    await expect(getDeviceId()).resolves.toBe("a1b2c3");
  });

  it("turns off the FingerprintJS stats request", async () => {
    const getDeviceId = await importGetDeviceId();

    await getDeviceId();

    expect(load).toHaveBeenCalledWith({ monitoring: false });
  });

  it("reads the ID once for two calls", async () => {
    const getDeviceId = await importGetDeviceId();

    await Promise.all([getDeviceId(), getDeviceId()]);

    expect(load).toHaveBeenCalledOnce();
    expect(get).toHaveBeenCalledOnce();
  });

  it("returns null when FingerprintJS fails to load", async () => {
    load.mockRejectedValue(new Error("blocked"));
    const getDeviceId = await importGetDeviceId();

    await expect(getDeviceId()).resolves.toBeNull();
  });

  it("returns null when FingerprintJS fails to read the browser", async () => {
    get.mockRejectedValue(new Error("failed"));
    const getDeviceId = await importGetDeviceId();

    await expect(getDeviceId()).resolves.toBeNull();
  });
});
