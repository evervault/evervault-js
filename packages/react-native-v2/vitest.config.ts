import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import reactNative from "vitest-react-native";
import { flowPlugin } from "@bunchtogether/vite-plugin-flow";

export default defineConfig({
  plugins: [
    reactNative(),
    // Transform react-native's Flow syntax before esbuild sees it (must run on node_modules)
    flowPlugin({
      include: /node_modules[\\/]react-native[\\/].*\.js$/,
      exclude: undefined,
      flow: { all: true, pretty: true },
    }),
    react(),
  ],
  test: {
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./setup.test.ts"],
    // Force react-native to be transformed (so the Flow plugin runs) instead of left external
    server: {
      deps: {
        inline: ["react-native"],
      },
    },
  },
});
