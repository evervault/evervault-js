import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    outDir: "./dist",
    lib: {
      entry: resolve(__dirname, "index.ts"),
      name: "EvervaultCardValidator",
      fileName: "evervault-card-validator.main",
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.ts"),
      },
    },
  },
  plugins: [
    dts({ rollupTypes: true, bundledPackages: ["types"] }),
  ],
});
