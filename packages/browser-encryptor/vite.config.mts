import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["**/test/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  },
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "lib/main.js"),
      fileName: "evervault-browser-encryptor.main",
      name: "EvervaultBrowserEncryptor",
    },
  },
});
