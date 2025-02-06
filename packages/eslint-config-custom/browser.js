const base = require("./index");
const globals = require("globals");

module.exports = [
  ...base,
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: { globals: globals.browser },
  },
  {
    ignores: ["vite.config.*.timestamp-*"],
  },
];
