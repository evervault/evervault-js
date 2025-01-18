import { resolve } from "node:path";
import dotenv from "dotenv";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";

dotenv.config({ path: "../../.env" });

const plugins = [
  dts({
    rollupTypes: true,
    bundledPackages: [
      "types",
      "themes",
      "jss",
      "csstype",
      "@evervault/browser",
    ],
  }),
];

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "Evervault",
      fileName: "evervault-js",
    },
  },
  plugins,
});
