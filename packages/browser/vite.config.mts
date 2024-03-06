import { resolve } from "node:path";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";

export default defineConfig({
  server: {
    port: 4002,
  },
  preview: {
    port: 4002
  },
  base: "",
  test: {
    environment: "jsdom",
    include: ["**/test/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  },
  build: {
    target: "esnext",
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "lib/main.ts"),
      name: "Evervault",
      // the proper extensions will be added
      fileName: "evervault-",
      formats: ["umd", "es"],
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    }
  },
  plugins: [
    dts({
      rollupTypes: true,
    }),
  ],
});
