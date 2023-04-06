import { defineConfig } from "vitest/config";
import sri from "rollup-plugin-sri";

export default defineConfig({
  plugins: [
    {
      enforce: "post",
      ...sri({ publicPath: "/", algorithms: ["sha512"] }),
    },
  ],
});