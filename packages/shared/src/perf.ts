// Temporary instrumentation for CARD-993 (AP/GP render latency baseline).
// Not intended to ship — see plan notes on why this stays local/branch-only.

function isDev(): boolean {
  try {
    const env = (import.meta as unknown as { env?: { DEV?: boolean } }).env;
    return Boolean(env?.DEV);
  } catch {
    return false;
  }
}

export function markStart(name: string): void {
  if (typeof performance === "undefined") return;
  performance.mark(`${name}:start`);
}

export function markEndAndReport(name: string): void {
  if (typeof performance === "undefined") return;

  try {
    performance.mark(`${name}:end`);
    const { duration } = performance.measure(
      name,
      `${name}:start`,
      `${name}:end`
    );

    if (isDev()) {
      console.debug(`[ev-perf] ${name}: ${duration.toFixed(1)}ms`);
    }

    // TODO(CARD-993): wire to real RUM/analytics once available; this is a
    // temporary, best-effort hook that only fires if a host page defines it.
    if (typeof window !== "undefined") {
      (
        window as unknown as {
          __evervault_rum__?: {
            track: (name: string, duration: number) => void;
          };
        }
      ).__evervault_rum__?.track(name, duration);
    }
  } catch {
    // No matching start mark (e.g. an early-return path never started this
    // span) — nothing to report.
  }
}
