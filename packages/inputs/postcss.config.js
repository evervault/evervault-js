const postcssPresetEnv = require("postcss-preset-env");

const config = {
  plugins: [
    postcssPresetEnv({
      autoprefixer: { flexbox: "no-2009" },
      stage: 1,
      features: { "nesting-rules": true },
    }),
  ],
};

module.exports = config;
