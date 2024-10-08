const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");

module.exports = [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { ignores: ["*.config.{js,mjs,cjs,ts}", "dist/", "node_modules/"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
];
