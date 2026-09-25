// Wires perf.ts's markEndAndReport() RUM hook to the dev-server endpoint
// registered in vite.config.ts, so perf-baseline/measure.sh can collect
// ev:apple-pay:* measurements without a manual devtools-console copy/paste.
// One session id per page load — each reload of the example is a new round
// of measurements. Dev-only: the endpoint this posts to only exists when
// Vite's dev server is running it, not in a built/preview app.

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
