import preset from "postcss-preset-env";

export default {
  plugins: [
    preset({
      stage: 2,
      features: {
        "nesting-rules": true,
      },
    }),
  ],
};
