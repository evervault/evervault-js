import { defineConfig } from "vite";
import sri from "rollup-plugin-sri";
import { resolve } from "path";

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
