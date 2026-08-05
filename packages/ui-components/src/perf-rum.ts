// Wires shared's markEndAndReport() RUM hook to the dev-server endpoint
// registered in vite.config.ts, so examples/google-pay/perf-baseline/measure.sh
// can collect ev:google-pay:* measurements without a manual devtools-console
// copy/paste. Unlike Apple Pay (native button, no iframe, marks fire in the
// example's own top-level page), Google Pay's marks fire in here — this
// package renders inside an iframe with its own separate `window`, so the
// hook has to live on *this* window, posting to *this* dev server's own
// endpoint, rather than the example page's.
//
// One session id per page load — each reload of the iframe is a new round of
// measurements. Dev-only: the endpoint this posts to only exists when Vite's
// dev server is running it (and only once PERF_BASELINE_RESULTS_CSV is set —
// see vite.config.ts), not in a built/preview app or any other dev flow that
// happens to load this package.

if (import.meta.env.DEV) {
  const session = crypto.randomUUID();

  (
    window as unknown as {
      __evervault_rum__?: { track: (name: string, duration: number) => void };
    }
  ).__evervault_rum__ = {
    track(name, duration) {
      fetch("/api/perf-track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session, name, duration }),
      }).catch((error) => {
        console.debug("[perf-track] failed to send measurement", error);
      });
    },
  };
}
