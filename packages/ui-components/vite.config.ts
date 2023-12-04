import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { integrity } from "./vite/integrity";

const plugins = [react(), integrity()];

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 4001,
  },
  plugins,
});
