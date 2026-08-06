import { resolve } from "node:path";
import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

const RESULTS_CSV = resolve(__dirname, "perf-baseline/results.csv");
const CSV_HEADER = "timestamp,browser,session,measure,duration_ms\n";

function csvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

// Dev-only endpoint for perf-baseline/measure.sh: the example's
// window.__evervault_rum__ hook (src/perf-rum.ts) posts each ev:apple-pay:*
// measurement here instead of requiring a manual devtools-console
// copy/paste. This rides the same tunnel as the app itself — see the
// README's "why only the app is tunnelled" for why no separate port or
// tunnel is needed for it to reach a real device.
function perfTrackEndpoint(): Plugin {
  return {
    name: "perf-track-endpoint",
    configureServer(server) {
      server.middlewares.use("/api/perf-track", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          try {
            const { session, name, duration } = JSON.parse(body) as {
              session: string;
              name: string;
              duration: number;
            };
            const browser = req.headers["user-agent"] ?? "unknown";
            const timestamp = new Date().toISOString();

            if (!existsSync(RESULTS_CSV)) {
              writeFileSync(RESULTS_CSV, CSV_HEADER);
            }
            appendFileSync(
              RESULTS_CSV,
              [
                csvField(timestamp),
                csvField(browser),
                csvField(session),
                csvField(name),
                duration.toFixed(1),
              ].join(",") + "\n"
            );

            res.statusCode = 204;
            res.end();
          } catch (error) {
            console.error(
              "[perf-track] failed to record measurement",
              error
            );
            res.statusCode = 400;
            res.end();
          }
        });
      });
    },
  };
}

export default defineConfig({
  // Load root evervault-js/.env (VITE_EV_*, VITE_MERCHANT_ID, etc.)
  envDir: resolve(__dirname, "../.."),
  plugins: [basicSsl(), perfTrackEndpoint()],
  server: {
    port: 4000,
    strictPort: true,
  },
  resolve: {
    // Dev-only module resolution: use local browser source so coupon changes
    // apply without depending on VITE_EVERVAULT_JS_URL / preview port 4002
    // (often stolen by stale vite processes). Does not change server port,
    // TLS, or domain association — tunneling is unaffected.
    alias: {
      "@evervault/browser": resolve(
        __dirname,
        "../../packages/browser/lib/main.ts"
      ),
    },
  },
});
