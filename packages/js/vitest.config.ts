import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    env: {
      VITE_EVERVAULT_JS_URL: "https://js.evervault.test/v2",
    },
  },
});
