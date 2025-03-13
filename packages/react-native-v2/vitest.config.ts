import { defineConfig } from "vitest/config";
import reactNative from "vitest-react-native";

export default defineConfig({
  plugins: [reactNative()],
  test: {
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./setup.test.ts"],
  },
});
