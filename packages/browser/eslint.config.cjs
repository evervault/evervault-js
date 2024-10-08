const browser = require("eslint-config-custom/browser");

module.exports = [
  ...browser,
  {
    rules: {
      // bitwise is needed for crypto ops
      "no-bitwise": "off",
    },
  },
];
