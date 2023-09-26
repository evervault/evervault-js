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
      ...sri({ publicPath: "/v2/", algorithms: ["sha512"] }),
    },
  ],
  base: "/v2/",
});
