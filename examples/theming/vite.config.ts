import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  envDir: resolve(__dirname, "../.."),
});
