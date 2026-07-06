import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { reactNative } from "@srsholmes/vitest-react-native";

export default defineConfig({
  plugins: [react(), reactNative()],
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./setup.test.ts"],
    server: {
      deps: {
        inline: ["react-native"],
      },
    },
  },
});
