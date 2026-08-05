import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, Plugin, UserConfig } from "vite";
import { integrity } from "./vite/integrity";
import istanbul from "vite-plugin-istanbul";

const plugins: UserConfig["plugins"] = [react(), integrity()];

if (process.env.VITE_TEST_COVERAGE === "true") {
  plugins.push(
    istanbul({
      include: "src/*",
      exclude: ["node_modules", "src/Form/**"],
      extension: [".js", ".ts", ".jsx", ".tsx"],
      requireEnv: false,
    })
  );
}

// Dev-only, and only active when PERF_BASELINE_RESULTS_CSV is set (by
// examples/google-pay/perf-baseline/measure.sh): appends ev:google-pay:*
// measurements posted by src/perf-rum.ts straight to that CSV path. This
// package is shared by every example, so it's a no-op unless that env var is
// present — no effect on any other dev flow that loads ui-components.
const CSV_HEADER = "timestamp,browser,session,measure,duration_ms\n";

function csvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function perfTrackEndpoint(): Plugin | null {
  const resultsCsv = process.env.PERF_BASELINE_RESULTS_CSV;
  if (!resultsCsv) return null;

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

            if (!existsSync(resultsCsv)) {
              mkdirSync(dirname(resultsCsv), { recursive: true });
              writeFileSync(resultsCsv, CSV_HEADER);
            }
            appendFileSync(
              resultsCsv,
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
            console.error("[perf-track] failed to record measurement", error);
            res.statusCode = 400;
            res.end();
          }
        });
      });
    },
  };
}

const perfTrackPlugin = perfTrackEndpoint();
if (perfTrackPlugin) plugins.push(perfTrackPlugin);

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 4001,
  },
  plugins,
});
