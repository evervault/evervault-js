import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import reactNative from "vitest-react-native";
import { flowPlugin } from "@bunchtogether/vite-plugin-flow";

export default defineConfig({
  plugins: [
    reactNative(),
    // Strip Flow from inlined react-native so we don't get "Unexpected token 'typeof'"
    flowPlugin({
      include: [
        /node_modules[\/]react-native[\/].*\.js$/,
        // /node_modules[\/]@react-native[\/].*\.js$/,
      ],
      exclude: [],
      flow: { all: true, pretty: true, ignoreUninitializedFields: false },
    }),
    react(),
  ],
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
