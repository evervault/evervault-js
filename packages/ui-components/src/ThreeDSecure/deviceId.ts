let deviceId: Promise<string | null> | null = null;

async function loadDeviceId(): Promise<string | null> {
  try {
    // Loaded on demand, so only frames that profile download the library.
    const FingerprintJS = await import("@fingerprintjs/fingerprintjs");
    // `monitoring: false` stops the library's stats request to its own servers.
    const agent = await FingerprintJS.load({ monitoring: false });
    const { visitorId } = await agent.get();
    return visitorId;
  } catch {
    return null;
  }
}

/**
 * Returns an ID for this browser, or `null` if it can't be read.
 * The ID is read once for each frame. It never throws, because 3DS
 * profiling works without a device ID.
 */
export function getDeviceId(): Promise<string | null> {
  deviceId ??= loadDeviceId();
  return deviceId;
}
