const browser = require("./browser");
const react = require("eslint-plugin-react");
const hooks = require("eslint-plugin-react-hooks");

module.exports = [
  ...browser,
  {
    plugins: { react },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  {
    plugins: { "react-hooks": hooks },
    rules: hooks.configs.recommended.rules,
  },
];
