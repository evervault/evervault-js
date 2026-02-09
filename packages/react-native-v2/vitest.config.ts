import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import reactNative from "vitest-react-native";

export default defineConfig({
  plugins: [reactNative(), react()],
  test: {
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./setup.test.ts"],
    server: {
      deps: {
        inline: ["react-native"],
      },
    },
  },
});
