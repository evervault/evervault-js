import { resolve } from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

dotenv.config({ path: "../../.env" });

export default defineConfig({
  server: {
    port: 4003,
  },
  preview: {
    port: 4003,
  },
  build: {
    outDir: 'dist',
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "src/index.ts"),
      name: "Evervault",
      // the proper extensions will be added
      fileName: "encryption.main",
    },
  },
});
