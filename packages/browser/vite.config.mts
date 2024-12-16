import { resolve } from "node:path";
import dotenv from "dotenv";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";
import istanbul from "vite-plugin-istanbul";

dotenv.config({ path: "../../.env" });

const plugins = [
  dts({
    rollupTypes: true,
  }),
];

const generateCoverage = process.env.VITE_TEST_COVERAGE === "true";

if (generateCoverage) {
  plugins.push(
    istanbul({
      include: "lib/*",
      exclude: [
        "node_modules",
        "test/",
        "lib/ui/form.ts",
        "lib/core/inputs.ts",
        "lib/utils/calculateHeight.ts",
      ],
      extension: [".js", ".ts"],
      requireEnv: false,
      forceBuildInstrument: true,
    })
  );
}

export default defineConfig({
  server: {
    port: 4002,
  },
  preview: {
    port: 4002,
  },
  test: {
    environment: "jsdom",
    include: ["**/test/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  },
  build: {
    sourcemap: generateCoverage,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "lib/main.ts"),
      name: "Evervault",
      // the proper extensions will be added
      fileName: "evervault-browser.main",
    },
  },
  plugins,
});
