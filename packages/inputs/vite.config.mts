import { defineConfig } from "vite";
import sri from "rollup-plugin-sri";

export default defineConfig({
  plugins: [
    {
      enforce: "post",
      ...sri({ publicPath: "/v2/", algorithms: ["sha512"] }),
    },
  ],
  base: "/v2/",
});
