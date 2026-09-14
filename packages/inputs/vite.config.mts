import { resolve } from "node:path";
import sri from "rollup-plugin-sri";
import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  build: {
    outDir: "../dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        reveal: resolve(__dirname, "src/reveal.html"),
      },
    },
  },
  plugins: [
    {
      enforce: "post",
      // Must match `base`; sri strips this prefix to find each file in the bundle.
      ...sri({ publicPath: "./", algorithms: ["sha512"] }),
    } as never,
  ],
  // Relative so one build works under both the live and pinned "@<version>" prefixes.
  base: "./",
});
