import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        object_test: resolve(__dirname, "object_test.html"),
      },
    },
  },
});
