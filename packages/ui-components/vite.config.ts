import react from "@vitejs/plugin-react";
import { defineConfig, UserConfig } from "vite";
import { integrity } from "./vite/integrity";
import istanbul from "vite-plugin-istanbul";

const plugins: UserConfig["plugins"] = [react(), integrity()];

if (process.env.VITE_TEST_COVERAGE === "true") {
  plugins.push(
    istanbul({
      include: "src/*",
      exclude: ["node_modules", "src/tests/"],
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
  plugins,
});
