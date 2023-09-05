import dts from "vite-plugin-dts";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  esbuild: {
    banner: `"use client";`
  },
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "lib/main.tsx"),
      name: "EvervaultReact",
      // the proper extensions will be added
      fileName: "evervault-react.main",
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
  plugins: [
    react({ jsxRuntime: "classic" }),
    dts({
      rollupTypes: true,
    }),
  ],
});
