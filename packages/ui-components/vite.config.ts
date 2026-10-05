import react from "@vitejs/plugin-react";
import type { UserConfig } from "vite";
import { defineConfig } from "vitest/config";
import { integrity } from "./vite/integrity";
import { componentPreload } from "./vite/preload";
import istanbul from "vite-plugin-istanbul";

const plugins: UserConfig["plugins"] = [
  react(),
  integrity(),
  componentPreload(),
];

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

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 4001,
  },
  preview: {
    headers: {
      "Content-Security-Policy":
        "script-src 'self' *.evervault.com fonts.googleapis.com fonts.gstatic.com https://pay.google.com/gp/p/js/pay.js https://applepay.cdn-apple.com;",
    },
  },
  build: {
    manifest: true,
  },
  plugins,
  test: {
    setupFiles: ["./test/setup.ts"],
  },
});
