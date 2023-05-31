import type { Config } from "postcss-load-config";
import postcssPresetEnv from "postcss-preset-env";

const config = {
  plugins: [
    postcssPresetEnv({
      autoprefixer: { flexbox: "no-2009" },
      stage: 1,
      features: { "nesting-rules": true },
    }),
  ],
} satisfies Config;

export default config;
