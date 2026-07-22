import { resolve } from "node:path";
import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  // Load root evervault-js/.env (VITE_EV_*, VITE_MERCHANT_ID, etc.)
  envDir: resolve(__dirname, "../.."),
  plugins: [basicSsl()],
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
